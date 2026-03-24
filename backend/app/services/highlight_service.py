from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.highlight import TranscriptHighlight
from app.schemas.highlight import TranscriptHighlightCreate


def get_highlights(session: Session, transcript_id: int) -> list[TranscriptHighlight]:
    return list(
        session.exec(
            select(TranscriptHighlight).where(
                TranscriptHighlight.transcript_id == transcript_id
            )
        ).all()
    )


def create_highlight(
    session: Session, data: TranscriptHighlightCreate
) -> TranscriptHighlight:
    highlight = TranscriptHighlight(
        transcript_id=data.transcript_id,
        segment_id=data.segment_id,
        note=data.note,
    )
    session.add(highlight)
    session.commit()
    session.refresh(highlight)
    return highlight


def delete_highlight(session: Session, highlight_id: int) -> None:
    highlight = session.get(TranscriptHighlight, highlight_id)
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    session.delete(highlight)
    session.commit()
