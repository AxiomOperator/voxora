"""
TranscriptionService — Phase 2 implementation.

This service provides the boundary between the job router and the actual
transcription engine. In Phase 2 the engine is a stub that produces
realistic-looking placeholder output. In a later phase, replace
_run_engine() with a real Whisper (or equivalent) call using the NVIDIA GPU.

GPU extension point:
    The method _run_engine() is the single place where GPU/CUDA code
    will be introduced. Everything above it (job lifecycle, segment
    persistence) stays the same regardless of the engine backend.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session

from app.models.transcription_job import TranscriptionJob
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment


# ---------------------------------------------------------------------------
# Engine stub — replace this block in a later phase with real Whisper code
# ---------------------------------------------------------------------------

def _run_engine(file_path: str, language: Optional[str]) -> dict:
    """
    Stub transcription engine.

    Replace with:
        import whisper
        model = whisper.load_model("base", device="cuda")
        result = model.transcribe(file_path, language=language)
        return result

    Returns a dict shaped like Whisper output:
        {
            "text": str,
            "language": str,
            "segments": [{"id": int, "start": float, "end": float, "text": str}, ...]
        }
    """
    return {
        "text": "[Phase 2 stub] Transcription will appear here once the ASR engine is integrated.",
        "language": language or "en",
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 5.0,
                "text": "[Phase 2 stub] Transcription will appear here once the ASR engine is integrated.",
            }
        ],
    }


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class TranscriptionService:
    def process_job(self, job: TranscriptionJob, session: Session) -> Transcript:
        """
        Run the full transcription lifecycle for a job:
          1. Mark job as processing
          2. Call the engine
          3. Persist Transcript + TranscriptSegments
          4. Mark job as done (or error on failure)
          5. Return the Transcript
        """
        # Mark started
        job.status = "processing"
        job.started_at = datetime.now(timezone.utc)
        job.updated_at = datetime.now(timezone.utc)
        session.add(job)
        session.commit()
        session.refresh(job)

        try:
            result = _run_engine(
                file_path=self._resolve_file_path(job, session),
                language=job.language,
            )

            # Persist transcript
            transcript = Transcript(
                media_file_id=job.media_file_id,
                job_id=job.id,
                full_text=result["text"],
                detected_language=result.get("language"),
            )
            session.add(transcript)
            session.commit()
            session.refresh(transcript)

            # Persist segments
            for seg in result.get("segments", []):
                segment = TranscriptSegment(
                    transcript_id=transcript.id,
                    segment_index=seg["id"],
                    start_seconds=seg["start"],
                    end_seconds=seg["end"],
                    text=seg["text"],
                )
                session.add(segment)
            session.commit()

            # Mark job done
            job.status = "done"
            job.completed_at = datetime.now(timezone.utc)
            job.updated_at = datetime.now(timezone.utc)
            session.add(job)
            session.commit()
            session.refresh(transcript)

            return transcript

        except Exception as exc:
            job.status = "error"
            job.error_message = str(exc)
            job.updated_at = datetime.now(timezone.utc)
            session.add(job)
            session.commit()
            raise

    def _resolve_file_path(self, job: TranscriptionJob, session: Session) -> str:
        from app.models.media_file import MediaFile
        media = session.get(MediaFile, job.media_file_id)
        if not media:
            raise ValueError(f"MediaFile {job.media_file_id} not found")
        return media.file_path


transcription_service = TranscriptionService()

