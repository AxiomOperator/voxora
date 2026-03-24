from datetime import datetime
from typing import List

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.note import TranscriptNote
from app.schemas.note import TranscriptNoteCreate, TranscriptNoteUpdate


def get_notes(session: Session, transcript_id: int) -> List[TranscriptNote]:
    return session.exec(
        select(TranscriptNote)
        .where(TranscriptNote.transcript_id == transcript_id)
        .order_by(TranscriptNote.created_at)
    ).all()


def create_note(session: Session, transcript_id: int, data: TranscriptNoteCreate) -> TranscriptNote:
    note = TranscriptNote(
        transcript_id=transcript_id,
        segment_id=data.segment_id,
        start_seconds=data.start_seconds,
        end_seconds=data.end_seconds,
        content=data.content,
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


def update_note(session: Session, note_id: int, data: TranscriptNoteUpdate) -> TranscriptNote:
    note = session.get(TranscriptNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    fields = data.model_dump(exclude_unset=True)
    for key, value in fields.items():
        setattr(note, key, value)
    note.updated_at = datetime.utcnow()
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


def delete_note(session: Session, note_id: int) -> None:
    note = session.get(TranscriptNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    session.delete(note)
    session.commit()
