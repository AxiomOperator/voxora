from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TranscriptionJobCreate(BaseModel):
    media_file_id: int
    language: Optional[str] = None
    diarization_enabled: bool = False


class TranscriptionJobRead(BaseModel):
    id: int
    media_file_id: int
    transcript_id: Optional[int]
    status: str
    language: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    runtime_metadata: Optional[str] = None
    diarization_enabled: bool = False
    retry_count: int = 0

    model_config = {"from_attributes": True}
