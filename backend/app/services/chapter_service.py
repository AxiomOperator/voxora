from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.chapter import TranscriptChapter
from app.schemas.chapter import TranscriptChapterCreate, TranscriptChapterUpdate


def get_chapters(session: Session, transcript_id: int) -> list[TranscriptChapter]:
    return list(
        session.exec(
            select(TranscriptChapter)
            .where(TranscriptChapter.transcript_id == transcript_id)
            .order_by(TranscriptChapter.start_seconds)
        ).all()
    )


def create_chapter(
    session: Session, transcript_id: int, data: TranscriptChapterCreate
) -> TranscriptChapter:
    chapter = TranscriptChapter(
        transcript_id=transcript_id,
        title=data.title,
        start_seconds=data.start_seconds,
        end_seconds=data.end_seconds,
    )
    session.add(chapter)
    session.commit()
    session.refresh(chapter)
    return chapter


def update_chapter(
    session: Session, chapter_id: int, data: TranscriptChapterUpdate
) -> TranscriptChapter:
    chapter = session.get(TranscriptChapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(chapter, key, value)
    session.add(chapter)
    session.commit()
    session.refresh(chapter)
    return chapter


def delete_chapter(session: Session, chapter_id: int) -> None:
    chapter = session.get(TranscriptChapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    session.delete(chapter)
    session.commit()
