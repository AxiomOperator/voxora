from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class TranscriptionJob(SQLModel, table=True):
    __tablename__ = "transcription_jobs"

    id: Optional[int] = Field(default=None, primary_key=True)
    media_file_id: int = Field(foreign_key="media_files.id", index=True)
    status: str = Field(default="pending")  # pending | processing | done | error
    language: Optional[str] = Field(default=None)
    error_message: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    transcript_id: Optional[int] = Field(default=None)
