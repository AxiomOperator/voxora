from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class MediaFile(SQLModel, table=True):
    __tablename__ = "media_files"

    id: Optional[int] = Field(default=None, primary_key=True)
    original_name: str
    stored_name: str
    file_path: str
    mime_type: str
    size_bytes: int
    status: str = Field(default="pending")  # pending | processing | done | error
    project_id: Optional[int] = Field(default=None, foreign_key="projects.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
