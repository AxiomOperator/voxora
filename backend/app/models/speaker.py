from typing import Optional
from sqlmodel import Field, SQLModel


class Speaker(SQLModel, table=True):
    __tablename__ = "speakers"

    id: Optional[int] = Field(default=None, primary_key=True)
    transcript_id: int = Field(foreign_key="transcripts.id", index=True)
    label: str          # original label from ASR e.g. "SPEAKER_00"
    name: Optional[str] = Field(default=None)  # user-assigned display name
