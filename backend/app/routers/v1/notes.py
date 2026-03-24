from typing import List

from fastapi import APIRouter
from fastapi.responses import Response

from app.dependencies import SessionDep
from app.schemas.note import TranscriptNoteCreate, TranscriptNoteUpdate, TranscriptNoteRead
from app.services import note_service

router = APIRouter()


@router.get("/{transcript_id}/notes", response_model=List[TranscriptNoteRead])
def list_notes(transcript_id: int, session: SessionDep):
    return note_service.get_notes(session, transcript_id)


@router.post("/{transcript_id}/notes", response_model=TranscriptNoteRead, status_code=201)
def create_note(transcript_id: int, payload: TranscriptNoteCreate, session: SessionDep):
    return note_service.create_note(session, transcript_id, payload)


@router.patch("/{transcript_id}/notes/{note_id}", response_model=TranscriptNoteRead)
def update_note(transcript_id: int, note_id: int, payload: TranscriptNoteUpdate, session: SessionDep):
    return note_service.update_note(session, note_id, payload)


@router.delete("/{transcript_id}/notes/{note_id}", status_code=204)
def delete_note(transcript_id: int, note_id: int, session: SessionDep):
    note_service.delete_note(session, note_id)
    return Response(status_code=204)
