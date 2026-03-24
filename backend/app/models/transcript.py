from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Transcript(SQLModel, table=True):
    __tablename__ = "transcripts"

    id: Optional[int] = Field(default=None, primary_key=True)
    media_file_id: int = Field(foreign_key="media_files.id", index=True)
    job_id: int = Field(foreign_key="transcription_jobs.id", index=True)
    full_text: str = Field(default="")
    detected_language: Optional[str] = Field(default=None)
    review_status: str = Field(default="draft")  # draft | in_review | reviewed | exported
    last_reviewed_at: Optional[datetime] = Field(default=None)
    review_notes: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
