from typing import List

import fitz
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.meeting import MeetingNoteCreate, MeetingNoteResponse
from app.services import meeting_service

router = APIRouter(prefix="/meetings", tags=["Meetings"])


@router.get("", response_model=List[MeetingNoteResponse])
async def list_notes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await meeting_service.list_notes(current_user.id, db)


@router.post("", response_model=MeetingNoteResponse, status_code=201)
async def create_note(
    payload: MeetingNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await meeting_service.create_note(current_user.id, payload, db)


@router.post("/upload", response_model=MeetingNoteResponse, status_code=201)
async def upload_pdf(
    title: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are accepted.")

    raw = await file.read()
    doc = fitz.open(stream=raw, filetype="pdf")
    content = "\n".join(page.get_text() for page in doc).strip()

    if not content:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not extract text from this PDF.")

    payload = MeetingNoteCreate(title=title, content=content, source="pdf")
    return await meeting_service.create_note(current_user.id, payload, db)


@router.get("/{note_id}", response_model=MeetingNoteResponse)
async def get_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await meeting_service.get_note(note_id, current_user.id, db)


@router.delete("/{note_id}", status_code=204)
async def delete_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await meeting_service.delete_note(note_id, current_user.id, db)
