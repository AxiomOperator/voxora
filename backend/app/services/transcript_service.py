"""
TranscriptService — handles transcript and segment editing operations.
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.speaker import Speaker
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment
from app.schemas.transcript import TranscriptUpdate
from app.schemas.transcript_segment import TranscriptSegmentUpdate


class TranscriptService:
    def update_transcript(
        self, transcript_id: int, payload: TranscriptUpdate, session: Session
    ) -> Transcript:
        transcript = session.get(Transcript, transcript_id)
        if not transcript:
            raise HTTPException(status_code=404, detail="Transcript not found")
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(transcript, key, value)
        transcript.updated_at = datetime.now(timezone.utc)
        session.add(transcript)
        session.commit()
        session.refresh(transcript)
        return transcript

    def update_segment(
        self, transcript_id: int, segment_id: int, payload: TranscriptSegmentUpdate, session: Session
    ) -> TranscriptSegment:
        segment = session.get(TranscriptSegment, segment_id)
        if not segment or segment.transcript_id != transcript_id:
            raise HTTPException(status_code=404, detail="Segment not found")
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(segment, key, value)
        session.add(segment)
        # Update transcript updated_at
        transcript = session.get(Transcript, transcript_id)
        if transcript:
            transcript.updated_at = datetime.now(timezone.utc)
            session.add(transcript)
        session.commit()
        session.refresh(segment)
        return segment

    def get_speakers(self, transcript_id: int, session: Session) -> List[Speaker]:
        return session.exec(
            select(Speaker).where(Speaker.transcript_id == transcript_id)
        ).all()

    def ensure_speakers_from_segments(self, transcript_id: int, session: Session) -> List[Speaker]:
        """
        Derive Speaker rows from the distinct speaker_label values in segments.
        Safe to call multiple times — skips labels that already have a Speaker row.
        """
        segments = session.exec(
            select(TranscriptSegment).where(TranscriptSegment.transcript_id == transcript_id)
        ).all()
        existing = {s.label for s in self.get_speakers(transcript_id, session)}
        labels = {seg.speaker_label for seg in segments if seg.speaker_label}
        for label in labels - existing:
            speaker = Speaker(transcript_id=transcript_id, label=label)
            session.add(speaker)
        session.commit()
        return self.get_speakers(transcript_id, session)

    def update_speaker(
        self, transcript_id: int, speaker_id: int, name: str, session: Session
    ) -> Speaker:
        speaker = session.get(Speaker, speaker_id)
        if not speaker or speaker.transcript_id != transcript_id:
            raise HTTPException(status_code=404, detail="Speaker not found")
        speaker.name = name
        session.add(speaker)
        session.commit()
        session.refresh(speaker)
        return speaker


transcript_service = TranscriptService()
