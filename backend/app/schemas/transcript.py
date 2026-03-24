from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TranscriptRead(BaseModel):
    id: int
    media_file_id: int
    job_id: int
    full_text: str
    detected_language: Optional[str]
    review_status: str
    last_reviewed_at: Optional[datetime]
    review_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TranscriptUpdate(BaseModel):
    full_text: Optional[str] = None
    detected_language: Optional[str] = None
    review_status: Optional[str] = None
    review_notes: Optional[str] = None
    last_reviewed_at: Optional[datetime] = None
