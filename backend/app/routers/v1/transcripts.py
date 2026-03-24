from typing import List
from fastapi import APIRouter, HTTPException
from sqlmodel import select
from app.dependencies import SessionDep
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment
from app.schemas.transcript import TranscriptRead
from app.schemas.transcript_segment import TranscriptSegmentRead

router = APIRouter()


@router.get("", response_model=List[TranscriptRead])
def list_transcripts(session: SessionDep):
    transcripts = session.exec(
        select(Transcript).order_by(Transcript.created_at.desc())
    ).all()
    return transcripts


@router.get("/{transcript_id}", response_model=TranscriptRead)
def get_transcript(transcript_id: int, session: SessionDep):
    transcript = session.get(Transcript, transcript_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return transcript


@router.get("/{transcript_id}/segments", response_model=List[TranscriptSegmentRead])
def get_transcript_segments(transcript_id: int, session: SessionDep):
    transcript = session.get(Transcript, transcript_id)
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    segments = session.exec(
        select(TranscriptSegment)
        .where(TranscriptSegment.transcript_id == transcript_id)
        .order_by(TranscriptSegment.segment_index)
    ).all()
    return segments
