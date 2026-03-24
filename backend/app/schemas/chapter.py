from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TranscriptChapterCreate(BaseModel):
    title: str
    start_seconds: float
    end_seconds: float


class TranscriptChapterUpdate(BaseModel):
    title: Optional[str] = None
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None


class TranscriptChapterRead(BaseModel):
    id: int
    transcript_id: int
    title: str
    start_seconds: float
    end_seconds: float
    created_at: datetime

    model_config = {"from_attributes": True}
