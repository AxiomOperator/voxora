from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from sqlmodel import select

from app.dependencies import SessionDep
from app.models.transcription_job import TranscriptionJob
from app.schemas.transcription_job import TranscriptionJobCreate, TranscriptionJobRead
from app.services.transcription_service import transcription_service

router = APIRouter()


def _run_transcription(job_id: int, db_url: str) -> None:
    """Background task: runs transcription using its own DB session."""
    from sqlmodel import create_engine, Session
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    with Session(engine) as session:
        job = session.get(TranscriptionJob, job_id)
        if job:
            try:
                transcription_service.process_job(job, session)
            except Exception:
                pass  # error state already persisted by the service


@router.get("", response_model=List[TranscriptionJobRead])
def list_jobs(session: SessionDep, status: Optional[str] = Query(default=None)):
    stmt = select(TranscriptionJob).order_by(TranscriptionJob.created_at.desc())
    if status is not None:
        stmt = stmt.where(TranscriptionJob.status == status)
    return session.exec(stmt).all()


@router.get("/{job_id}", response_model=TranscriptionJobRead)
def get_job(job_id: int, session: SessionDep):
    job = session.get(TranscriptionJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("", response_model=TranscriptionJobRead, status_code=201)
def create_job(
    payload: TranscriptionJobCreate,
    background_tasks: BackgroundTasks,
    session: SessionDep,
):
    from app.models.media_file import MediaFile
    from app.core.config import settings

    media = session.get(MediaFile, payload.media_file_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media file not found")

    job = TranscriptionJob(
        media_file_id=payload.media_file_id,
        language=payload.language,
    )
    session.add(job)
    session.commit()
    session.refresh(job)

    background_tasks.add_task(_run_transcription, job.id, settings.DATABASE_URL)
    return job
