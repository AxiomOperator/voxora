from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel


class TranscriptHighlight(SQLModel, table=True):
    __tablename__ = "transcript_highlights"

    id: Optional[int] = Field(default=None, primary_key=True)
    transcript_id: int = Field(foreign_key="transcripts.id", index=True)
    segment_id: Optional[int] = Field(default=None, foreign_key="transcript_segments.id")
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
