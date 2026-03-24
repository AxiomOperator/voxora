from typing import List
from fastapi import APIRouter
from fastapi.responses import Response

from app.dependencies import SessionDep
from app.schemas.highlight import TranscriptHighlightCreate, TranscriptHighlightRead
from app.services import highlight_service

router = APIRouter()


@router.get(
    "/transcripts/{transcript_id}/highlights", response_model=List[TranscriptHighlightRead]
)
def list_highlights(transcript_id: int, session: SessionDep):
    return highlight_service.get_highlights(session, transcript_id)


@router.post(
    "/transcripts/{transcript_id}/highlights",
    response_model=TranscriptHighlightRead,
    status_code=201,
)
def create_highlight(transcript_id: int, payload: TranscriptHighlightCreate, session: SessionDep):
    # Override transcript_id from path
    payload.transcript_id = transcript_id
    return highlight_service.create_highlight(session, payload)


@router.delete("/transcripts/{transcript_id}/highlights/{highlight_id}", status_code=204)
def delete_highlight(transcript_id: int, highlight_id: int, session: SessionDep):
    highlight_service.delete_highlight(session, highlight_id)
    return Response(status_code=204)
