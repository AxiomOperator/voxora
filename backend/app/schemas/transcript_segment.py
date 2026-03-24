from typing import Optional
from pydantic import BaseModel


class TranscriptSegmentRead(BaseModel):
    id: int
    transcript_id: int
    segment_index: int
    start_seconds: float
    end_seconds: float
    text: str
    speaker_label: Optional[str]
    confidence: Optional[float]

    model_config = {"from_attributes": True}
