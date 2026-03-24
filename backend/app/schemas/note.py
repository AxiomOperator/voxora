from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class TranscriptNoteCreate(BaseModel):
    transcript_id: int
    segment_id: Optional[int] = None
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None
    content: str


class TranscriptNoteUpdate(BaseModel):
    content: Optional[str] = None
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None


class TranscriptNoteRead(BaseModel):
    id: int
    transcript_id: int
    segment_id: Optional[int]
    start_seconds: Optional[float]
    end_seconds: Optional[float]
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
