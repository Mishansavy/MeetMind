from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, BulkSaveRequest, ExtractedTaskPreview
from app.services import task_service, meeting_service, nlp_service

router = APIRouter(tags=["Tasks"])


@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await task_service.list_tasks(current_user.id, db)


@router.post("/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await task_service.create_task(current_user.id, payload, db)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await task_service.update_task(task_id, current_user.id, payload, db)


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await task_service.delete_task(task_id, current_user.id, db)


@router.post("/meetings/{note_id}/extract", response_model=list[ExtractedTaskPreview])
async def extract_tasks(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    note = await meeting_service.get_note(note_id, current_user.id, db)
    return nlp_service.extract_tasks_rule_based(note.content)


@router.post("/meetings/{note_id}/tasks", response_model=list[TaskResponse], status_code=201)
async def bulk_save_tasks(
    note_id: int,
    payload: BulkSaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await meeting_service.get_note(note_id, current_user.id, db)
    return await task_service.bulk_save_tasks(current_user.id, note_id, payload.tasks, db)
