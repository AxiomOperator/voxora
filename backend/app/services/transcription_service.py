"""
TranscriptionService — Phase 6.

Architecture
------------
Two layers:

1. TranscriptionService._run_engine(file_path, language) → raw dict
   Uses faster-whisper (WhisperModel) with lazy loading and GPU/CPU fallback.

2. TranscriptionService.process_job(job, session)
   Manages the full job lifecycle:
     pending → processing → completed / failed
   Persists Transcript + TranscriptSegment rows.
   Creates Speaker rows from distinct segment labels.
"""

import logging
import concurrent.futures
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session

from app.models.transcription_job import TranscriptionJob
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment

logger = logging.getLogger(__name__)

_executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)


class TranscriptionService:
    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self._model = None  # lazy load
        try:
            import torch  # type: ignore
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            self.device = "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"

    def _get_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel  # type: ignore
            self._model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
            )
        return self._model

    def _run_engine(self, file_path: str, language: Optional[str] = None) -> dict:
        model = self._get_model()
        segments_gen, info = model.transcribe(
            file_path,
            language=language,
            beam_size=5,
        )
        segments = []
        full_text_parts = []
        for idx, seg in enumerate(segments_gen):
            segments.append({
                "id": idx,
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip(),
                "speaker_label": "Speaker 1",
            })
            full_text_parts.append(seg.text.strip())

        if not full_text_parts:
            raise RuntimeError(f"Transcription of '{file_path}' produced no output.")

        return {
            "text": " ".join(full_text_parts),
            "language": info.language,
            "segments": segments,
        }

    def get_model_info(self) -> dict:
        return {
            "model_size": self.model_size,
            "device": self.device,
            "compute_type": self.compute_type,
        }

    def process_job(self, job: TranscriptionJob, session: Session) -> Transcript:
        """
        Full transcription lifecycle:
          1. Mark job as processing
          2. Run the engine
          3. Persist Transcript + TranscriptSegments
          4. Sync Speaker rows from segment labels
          5. Mark job as completed
          On any exception: mark job as failed with error_message
        """
        self._mark_processing(job, session)

        try:
            file_path = self._resolve_file_path(job, session)
            result = self._run_engine(file_path, job.language)

            transcript = self._persist_transcript(job, result, session)
            self._persist_segments(transcript, result.get("segments", []), session)
            self._sync_speakers(transcript.id, session)

            self._mark_completed(job, session)
            session.refresh(transcript)
            return transcript

        except Exception as exc:
            logger.exception("Transcription job %d failed: %s", job.id, exc)
            self._mark_failed(job, str(exc), session)
            raise

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _mark_processing(self, job: TranscriptionJob, session: Session) -> None:
        job.status = "processing"
        job.started_at = datetime.now(timezone.utc)
        job.updated_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()

    def _mark_completed(self, job: TranscriptionJob, session: Session) -> None:
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        job.updated_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()

    def _mark_failed(self, job: TranscriptionJob, error: str, session: Session) -> None:
        job.status = "failed"
        job.error_message = error
        job.updated_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()

    def _resolve_file_path(self, job: TranscriptionJob, session: Session) -> str:
        from app.models.media_file import MediaFile
        media = session.get(MediaFile, job.media_file_id)
        if not media:
            raise ValueError(f"MediaFile {job.media_file_id} not found")
        return media.file_path

    def _persist_transcript(
        self, job: TranscriptionJob, result: dict, session: Session
    ) -> Transcript:
        transcript = Transcript(
            media_file_id=job.media_file_id,
            job_id=job.id,
            full_text=result.get("text", ""),
            detected_language=result.get("language"),
        )
        session.add(transcript)
        session.commit()
        session.refresh(transcript)
        job.transcript_id = transcript.id
        session.add(job)
        session.commit()
        return transcript

    def _persist_segments(
        self, transcript: Transcript, raw_segments: list, session: Session
    ) -> None:
        for idx, seg in enumerate(raw_segments):
            segment = TranscriptSegment(
                transcript_id=transcript.id,
                segment_index=seg.get("id", idx),
                start_seconds=seg["start"],
                end_seconds=seg["end"],
                text=seg["text"],
                speaker_label=seg.get("speaker_label"),
            )
            session.add(segment)
        session.commit()

    def _sync_speakers(self, transcript_id: int, session: Session) -> None:
        """Create Speaker rows for any new speaker_label values in segments."""
        from app.services.transcript_service import transcript_service
        transcript_service.ensure_speakers_from_segments(transcript_id, session)


transcription_service = TranscriptionService()
