from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel


class TranscriptChapter(SQLModel, table=True):
    __tablename__ = "transcript_chapters"

    id: Optional[int] = Field(default=None, primary_key=True)
    transcript_id: int = Field(foreign_key="transcripts.id", index=True)
    title: str
    start_seconds: float
    end_seconds: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
