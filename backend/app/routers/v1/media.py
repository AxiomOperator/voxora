import os
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from sqlmodel import select
from app.dependencies import SessionDep
from app.models.media_file import MediaFile
from app.schemas.media_file import MediaFileRead
from app.services.file_service import file_service

router = APIRouter()


@router.get("", response_model=List[MediaFileRead])
def list_media(session: SessionDep):
    media_files = session.exec(
        select(MediaFile).order_by(MediaFile.created_at.desc())
    ).all()
    return media_files


@router.get("/{media_id}", response_model=MediaFileRead)
def get_media(media_id: int, session: SessionDep):
    media = session.get(MediaFile, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media file not found")
    return media


@router.post("/upload", response_model=MediaFileRead, status_code=201)
async def upload_media(
    session: SessionDep,
    file: UploadFile = File(...),
):
    saved = await file_service.save_upload(file)
    media = MediaFile(
        original_name=file.filename or "upload",
        stored_name=saved["stored_name"],
        file_path=saved["file_path"],
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=saved["size_bytes"],
        status="pending",
    )
    session.add(media)
    session.commit()
    session.refresh(media)
    return media


@router.delete("/{media_id}", status_code=204)
def delete_media(media_id: int, session: SessionDep):
    media = session.get(MediaFile, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media file not found")
    file_service.delete_file(media.file_path)
    session.delete(media)
    session.commit()
