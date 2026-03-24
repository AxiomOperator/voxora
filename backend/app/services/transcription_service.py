"""
TranscriptionService — Phase 9.

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
   Records runtime_metadata (compute_device, fallback info, timing).
"""

import json
import logging
import threading
import time
import concurrent.futures
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session

from app.models.transcription_job import TranscriptionJob
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment

logger = logging.getLogger(__name__)

_executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)
_gpu_semaphore = threading.Semaphore(1)


class TranscriptionService:
    def __init__(self, model_size: str = "base"):
        from app.core.config import settings
        self.model_size = model_size
        self._model = None  # lazy load

        compute_device = getattr(settings, "TRANSCRIPTION_COMPUTE_DEVICE", "auto")
        if compute_device == "cpu":
            self.device = "cpu"
        elif compute_device == "cuda":
            self.device = "cuda"
        else:  # "auto"
            try:
                import ctranslate2  # type: ignore
                self.device = "cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu"
            except Exception:
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
        from app.core.config import settings
        model = self._get_model()
        beam_size = getattr(settings, "TRANSCRIPTION_BEAM_SIZE", 5)
        segments_gen, info = model.transcribe(
            file_path,
            language=language,
            beam_size=beam_size,
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
          2. Acquire GPU semaphore (single-GPU concurrency guard)
          3. Run the engine (with CUDA-error fallback to CPU)
          4. Optionally run diarization and map speaker labels
          5. Save runtime_metadata
          6. Persist Transcript + TranscriptSegments
          7. Sync Speaker rows from segment labels
          8. Mark job as completed
          On any exception: record metadata then mark job as failed.
        """
        self._mark_processing(job, session)
        start_time = time.monotonic()
        fallback_used = False
        fallback_reason = None
        active_device = self.device
        active_compute_type = self.compute_type

        with _gpu_semaphore:
            try:
                file_path = self._resolve_file_path(job, session)
                result = self._run_engine(file_path, job.language)
            except Exception as exc:
                err_str = str(exc).lower()
                if any(k in err_str for k in ("cuda", "gpu", "out of memory", "device")):
                    logger.warning("GPU execution failed (%s), retrying on CPU", exc)
                    fallback_used = True
                    fallback_reason = f"GPU error: {exc}"
                    active_device = "cpu"
                    active_compute_type = "int8"
                    self._model = None
                    self.device = "cpu"
                    self.compute_type = "int8"
                    try:
                        result = self._run_engine(file_path, job.language)
                    except Exception as cpu_exc:
                        self._save_runtime_metadata(
                            job, start_time, active_device, active_compute_type,
                            fallback_used, fallback_reason, session,
                            diarization_meta={"diarization_status": "skipped"},
                        )
                        self._mark_failed(job, str(cpu_exc), session)
                        raise
                else:
                    self._save_runtime_metadata(
                        job, start_time, active_device, active_compute_type,
                        False, None, session,
                        diarization_meta={"diarization_status": "skipped"},
                    )
                    self._mark_failed(job, str(exc), session)
                    raise

        # Optionally apply diarization to segments
        diarization_meta: dict = {}
        diarize_enabled = getattr(job, "diarization_enabled", False)
        if diarize_enabled:
            diarization_meta = self._apply_diarization(file_path, result)
        else:
            diarization_meta = {"diarization_status": "disabled"}

        self._save_runtime_metadata(
            job, start_time, active_device, active_compute_type,
            fallback_used, fallback_reason, session,
            diarization_meta=diarization_meta,
        )
        transcript = self._persist_transcript(job, result, session)
        self._persist_segments(transcript, result.get("segments", []), session)
        self._sync_speakers(transcript.id, session)
        self._mark_completed(job, session)
        session.refresh(transcript)
        return transcript

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _save_runtime_metadata(
        self,
        job: TranscriptionJob,
        start_time: float,
        device: str,
        compute_type: str,
        fallback_used: bool,
        fallback_reason: Optional[str],
        session: Session,
        diarization_meta: Optional[dict] = None,
    ) -> None:
        elapsed = round(time.monotonic() - start_time, 2)
        metadata = {
            "compute_device": device,
            "model_name": self.model_size,
            "compute_type": compute_type,
            "fallback_used": fallback_used,
            "fallback_reason": fallback_reason,
            "processing_seconds": elapsed,
        }
        if diarization_meta:
            metadata.update(diarization_meta)
        job.runtime_metadata = json.dumps(metadata)
        job.updated_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()

    def _apply_diarization(self, file_path: str, result: dict) -> dict:
        """
        Run diarization and map speaker turns onto ASR segments by timestamp
        overlap.  Updates result["segments"] in-place.
        Returns diarization metadata dict.
        """
        from app.services.diarization_service import diarize
        dia = diarize(file_path, enabled=True)

        if dia["diarization_status"] == "error":
            logger.warning("Diarization error: %s", dia["diarization_error"])
            return {
                "diarization_status": dia["diarization_status"],
                "diarization_backend": dia["diarization_backend"],
                "diarization_error": dia["diarization_error"],
            }

        turns = dia.get("turns", [])
        if turns:
            for seg in result.get("segments", []):
                seg_mid = (seg["start"] + seg["end"]) / 2.0
                label = self._match_speaker(seg_mid, turns)
                seg["speaker_label"] = label

        return {
            "diarization_status": dia["diarization_status"],
            "diarization_backend": dia["diarization_backend"],
            "diarization_error": dia["diarization_error"],
            "diarization_turns": len(turns),
        }

    @staticmethod
    def _match_speaker(midpoint: float, turns: list) -> str:
        """Return the speaker label whose turn contains midpoint."""
        for turn in turns:
            if turn["start"] <= midpoint <= turn["end"]:
                return turn["speaker"]
        # Fall back to nearest turn by start time
        if turns:
            nearest = min(turns, key=lambda t: abs(t["start"] - midpoint))
            return nearest["speaker"]
        return "SPEAKER_00"

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
