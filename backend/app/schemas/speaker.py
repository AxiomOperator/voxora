from typing import Optional
from pydantic import BaseModel


class SpeakerRead(BaseModel):
    id: int
    transcript_id: int
    label: str
    name: Optional[str]

    model_config = {"from_attributes": True}


class SpeakerUpdate(BaseModel):
    name: str
