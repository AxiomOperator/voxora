from typing import List
from fastapi import APIRouter
from sqlmodel import select
from app.dependencies import SessionDep
from app.models.media_file import MediaFile
from app.schemas.media_file import MediaFileCreate, MediaFileRead

router = APIRouter()


@router.get("", response_model=List[MediaFileRead])
def list_media(session: SessionDep):
    media_files = session.exec(select(MediaFile)).all()
    return media_files


@router.post("", response_model=MediaFileRead, status_code=201)
def create_media(payload: MediaFileCreate, session: SessionDep):
    media_file = MediaFile.model_validate(payload)
    session.add(media_file)
    session.commit()
    session.refresh(media_file)
    return media_file
