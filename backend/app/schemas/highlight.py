from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TranscriptHighlightCreate(BaseModel):
    transcript_id: int
    segment_id: Optional[int] = None
    note: Optional[str] = None


class TranscriptHighlightRead(BaseModel):
    id: int
    transcript_id: int
    segment_id: Optional[int]
    note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
