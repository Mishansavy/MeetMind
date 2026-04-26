from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.meeting import MeetingNote, NoteSource
from app.schemas.meeting import MeetingNoteCreate


async def create_note(user_id: int, payload: MeetingNoteCreate, db: AsyncSession) -> MeetingNote:
    note = MeetingNote(
        user_id=user_id,
        title=payload.title,
        content=payload.content,
        source=NoteSource(payload.source),
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def list_notes(user_id: int, db: AsyncSession) -> list[MeetingNote]:
    result = await db.execute(
        select(MeetingNote)
        .where(MeetingNote.user_id == user_id)
        .order_by(MeetingNote.created_at.desc())
    )
    return result.scalars().all()


async def get_note(note_id: int, user_id: int, db: AsyncSession) -> MeetingNote:
    result = await db.execute(
        select(MeetingNote).where(MeetingNote.id == note_id, MeetingNote.user_id == user_id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return note


async def delete_note(note_id: int, user_id: int, db: AsyncSession) -> None:
    note = await get_note(note_id, user_id, db)
    await db.delete(note)
    await db.commit()
