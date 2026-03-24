from fastapi import BackgroundTasks, HTTPException
from sqlmodel import Session, select

from app.models.transcription_job import TranscriptionJob
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment


def get_job(session: Session, job_id: int) -> TranscriptionJob:
    job = session.get(TranscriptionJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def retry_job(
    session: Session,
    job_id: int,
    background_tasks: BackgroundTasks,
    db_url: str,
) -> TranscriptionJob:
    job = session.get(TranscriptionJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "failed":
        raise HTTPException(status_code=400, detail="Only failed jobs can be retried")

    # Delete existing transcript and segments for a clean slate
    existing_transcript = session.exec(
        select(Transcript).where(Transcript.job_id == job_id)
    ).first()
    if existing_transcript:
        segments = session.exec(
            select(TranscriptSegment).where(
                TranscriptSegment.transcript_id == existing_transcript.id
            )
        ).all()
        for seg in segments:
            session.delete(seg)
        session.delete(existing_transcript)
        session.commit()

    # Reset job state
    job.status = "pending"
    job.error_message = None
    job.started_at = None
    job.completed_at = None
    job.transcript_id = None
    session.add(job)
    session.commit()
    session.refresh(job)

    from app.routers.v1.jobs import _run_transcription
    background_tasks.add_task(_run_transcription, job.id, db_url)

    return job
