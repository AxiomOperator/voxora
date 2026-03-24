from typing import List
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from sqlmodel import select

from app.dependencies import SessionDep
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment
from app.schemas.transcript import TranscriptRead, TranscriptUpdate
from app.schemas.transcript_segment import TranscriptSegmentRead, TranscriptSegmentUpdate
from app.schemas.speaker import SpeakerRead, SpeakerUpdate
from app.services.transcript_service import transcript_service
from app.services.export_service import export_service

router = APIRouter()


@router.get("", response_model=List[TranscriptRead])
def list_transcripts(session: SessionDep):
    return session.exec(
        select(Transcript).order_by(Transcript.created_at.desc())
    ).all()


@router.get("/{transcript_id}", response_model=TranscriptRead)
def get_transcript(transcript_id: int, session: SessionDep):
    t = session.get(Transcript, transcript_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return t


@router.patch("/{transcript_id}", response_model=TranscriptRead)
def update_transcript(transcript_id: int, payload: TranscriptUpdate, session: SessionDep):
    return transcript_service.update_transcript(transcript_id, payload, session)


@router.get("/{transcript_id}/segments", response_model=List[TranscriptSegmentRead])
def get_transcript_segments(transcript_id: int, session: SessionDep):
    t = session.get(Transcript, transcript_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return session.exec(
        select(TranscriptSegment)
        .where(TranscriptSegment.transcript_id == transcript_id)
        .order_by(TranscriptSegment.segment_index)
    ).all()


@router.patch("/{transcript_id}/segments/{segment_id}", response_model=TranscriptSegmentRead)
def update_segment(
    transcript_id: int, segment_id: int, payload: TranscriptSegmentUpdate, session: SessionDep
):
    return transcript_service.update_segment(transcript_id, segment_id, payload, session)


@router.get("/{transcript_id}/speakers", response_model=List[SpeakerRead])
def get_speakers(transcript_id: int, session: SessionDep):
    t = session.get(Transcript, transcript_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transcript not found")
    # Ensure speaker rows are synced from segments
    return transcript_service.ensure_speakers_from_segments(transcript_id, session)


@router.patch("/{transcript_id}/speakers/{speaker_id}", response_model=SpeakerRead)
def update_speaker(
    transcript_id: int, speaker_id: int, payload: SpeakerUpdate, session: SessionDep
):
    return transcript_service.update_speaker(transcript_id, speaker_id, payload.name, session)


@router.get("/{transcript_id}/export")
def export_transcript(
    transcript_id: int,
    session: SessionDep,
    format: str = Query(default="txt", pattern="^(txt|srt|vtt)$"),
):
    t = session.get(Transcript, transcript_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transcript not found")
    segments = session.exec(
        select(TranscriptSegment)
        .where(TranscriptSegment.transcript_id == transcript_id)
        .order_by(TranscriptSegment.segment_index)
    ).all()
    try:
        content, media_type = export_service.export(t, list(segments), format)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    filename = f"transcript_{transcript_id}.{format}"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
