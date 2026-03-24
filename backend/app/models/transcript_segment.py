from typing import Optional
from sqlmodel import Field, SQLModel


class TranscriptSegment(SQLModel, table=True):
    __tablename__ = "transcript_segments"

    id: Optional[int] = Field(default=None, primary_key=True)
    transcript_id: int = Field(foreign_key="transcripts.id", index=True)
    segment_index: int
    start_seconds: float
    end_seconds: float
    text: str
    speaker_label: Optional[str] = Field(default=None)
    confidence: Optional[float] = Field(default=None)
