from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TranscriptRead(BaseModel):
    id: int
    media_file_id: int
    job_id: int
    full_text: str
    detected_language: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
