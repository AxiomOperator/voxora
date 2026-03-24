from typing import List
from fastapi import APIRouter
from fastapi.responses import Response

from app.dependencies import SessionDep
from app.schemas.chapter import TranscriptChapterCreate, TranscriptChapterRead, TranscriptChapterUpdate
from app.services import chapter_service

router = APIRouter()


@router.get("/transcripts/{transcript_id}/chapters", response_model=List[TranscriptChapterRead])
def list_chapters(transcript_id: int, session: SessionDep):
    return chapter_service.get_chapters(session, transcript_id)


@router.post(
    "/transcripts/{transcript_id}/chapters",
    response_model=TranscriptChapterRead,
    status_code=201,
)
def create_chapter(
    transcript_id: int, payload: TranscriptChapterCreate, session: SessionDep
):
    return chapter_service.create_chapter(session, transcript_id, payload)


@router.patch(
    "/transcripts/{transcript_id}/chapters/{chapter_id}",
    response_model=TranscriptChapterRead,
)
def update_chapter(
    transcript_id: int, chapter_id: int, payload: TranscriptChapterUpdate, session: SessionDep
):
    return chapter_service.update_chapter(session, chapter_id, payload)


@router.delete("/transcripts/{transcript_id}/chapters/{chapter_id}", status_code=204)
def delete_chapter(transcript_id: int, chapter_id: int, session: SessionDep):
    chapter_service.delete_chapter(session, chapter_id)
    return Response(status_code=204)
