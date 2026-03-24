import os
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
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


@router.post("/upload", response_model=List[MediaFileRead], status_code=201)
async def upload_media(
    session: SessionDep,
    files: List[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    results = []
    for file in files:
        # Validate the file has content
        first_byte = await file.read(1)
        await file.seek(0)
        if len(first_byte) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename or 'upload'}' is empty",
            )

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
        results.append(media)
    return results


@router.get("/{media_id}/stream")
def stream_media(media_id: int, session: SessionDep):
    media = session.get(MediaFile, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media file not found")
    file_path = Path(media.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        path=str(file_path),
        media_type=media.mime_type or "application/octet-stream",
    )


@router.delete("/{media_id}", status_code=204)
def delete_media(media_id: int, session: SessionDep):
    media = session.get(MediaFile, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media file not found")
    file_service.delete_file(media.file_path)
    session.delete(media)
    session.commit()
