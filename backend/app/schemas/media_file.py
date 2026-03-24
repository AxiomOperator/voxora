from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MediaFileCreate(BaseModel):
    original_name: str
    stored_name: str
    file_path: str
    mime_type: str
    size_bytes: int
    status: str = "pending"


class MediaFileUpdate(BaseModel):
    project_id: Optional[int] = None


class MediaFileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_name: str
    stored_name: str
    file_path: str
    mime_type: str
    size_bytes: int
    status: str
    project_id: Optional[int]
    created_at: datetime
