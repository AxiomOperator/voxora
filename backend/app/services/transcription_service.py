"""
TranscriptionService — Phase 3.

Architecture
------------
The service is split into two layers:

1. _run_engine(file_path, language) → raw dict
   ┌─────────────────────────────────────────────────────────────┐
   │  This is the ONLY place that touches the ASR model.         │
   │  To enable real transcription, replace the body of this     │
   │  function with a Whisper call:                              │
   │                                                             │
   │      import whisper                                         │
   │      model = whisper.load_model("base", device="cuda")      │
   │      return model.transcribe(file_path, language=language)  │
   │                                                             │
   │  The rest of the service — job lifecycle, segment           │
   │  persistence, error handling — stays unchanged.             │
   └─────────────────────────────────────────────────────────────┘

2. TranscriptionService.process_job(job, session)
   Manages the full lifecycle:
     pending → processing → completed / failed
   Persists Transcript + TranscriptSegment rows.
   Creates Speaker rows from distinct segment labels (Phase 3+).

GPU detection
-------------
_gpu_available() checks for a CUDA-capable device at import time
so the service can log a meaningful message at startup.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session

from app.models.transcription_job import TranscriptionJob
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# GPU detection (informational — does not gate the stub engine)
# ---------------------------------------------------------------------------

def _gpu_available() -> bool:
    try:
        import torch  # type: ignore
        return torch.cuda.is_available()
    except ImportError:
        return False


_HAS_GPU = _gpu_available()
if _HAS_GPU:
    logger.info("CUDA device detected — real ASR engine can be enabled in _run_engine()")
else:
    logger.info("No CUDA device detected — using stub transcription engine")


# ---------------------------------------------------------------------------
# Engine — replace this function body to enable real transcription
# ---------------------------------------------------------------------------

def _run_engine(file_path: str, language: Optional[str]) -> dict:
    """
    Transcription engine boundary.

    Current implementation: deterministic stub.

    To enable real GPU-backed transcription, replace this function body:

        import whisper
        device = "cuda" if _HAS_GPU else "cpu"
        model = whisper.load_model("base", device=device)
        return model.transcribe(file_path, language=language, word_timestamps=True)

    Expected return shape (Whisper-compatible):
        {
            "text": str,
            "language": str,
            "segments": [
                {
                    "id": int,
                    "start": float,
                    "end": float,
                    "text": str,
                    "speaker_label": str | None   # populated by diarization
                },
                ...
            ]
        }
    """
    return {
        "text": (
            "[Stub] Transcription will appear here once the ASR engine is wired in. "
            "See _run_engine() in app/services/transcription_service.py."
        ),
        "language": language or "en",
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 5.0,
                "text": (
                    "[Stub] Transcription will appear here once the ASR engine is wired in."
                ),
                "speaker_label": None,
            }
        ],
    }


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class TranscriptionService:
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
            result = _run_engine(file_path, job.language)

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
        for seg in raw_segments:
            segment = TranscriptSegment(
                transcript_id=transcript.id,
                segment_index=seg["id"],
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
