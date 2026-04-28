from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, ExtractedTaskPreview


async def list_tasks(user_id: int, db: AsyncSession) -> list[Task]:
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.is_complete.asc(), Task.created_at.desc())
    )
    return result.scalars().all()


async def get_task(task_id: int, user_id: int, db: AsyncSession) -> Task:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


async def create_task(user_id: int, payload: TaskCreate, db: AsyncSession) -> Task:
    task = Task(
        user_id=user_id,
        meeting_note_id=payload.meeting_note_id,
        title=payload.title,
        assignee_name=payload.assignee_name,
        deadline=payload.deadline,
        priority=payload.priority,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def update_task(task_id: int, user_id: int, payload: TaskUpdate, db: AsyncSession) -> Task:
    task = await get_task(task_id, user_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(task_id: int, user_id: int, db: AsyncSession) -> None:
    task = await get_task(task_id, user_id, db)
    await db.delete(task)
    await db.commit()


async def bulk_save_tasks(
    user_id: int,
    note_id: int,
    previews: list[ExtractedTaskPreview],
    db: AsyncSession,
) -> list[Task]:
    tasks = [
        Task(
            user_id=user_id,
            meeting_note_id=note_id,
            title=p.title,
            assignee_name=p.assignee_name,
            deadline=p.deadline,
            priority=p.priority,
        )
        for p in previews
    ]
    db.add_all(tasks)
    await db.commit()
    for t in tasks:
        await db.refresh(t)
    return tasks
