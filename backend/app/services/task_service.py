from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, ExtractedTaskPreview
from app.services.nlp_service import urgency_score as compute_urgency


async def _pending_count(user_id: int, db: AsyncSession) -> int:
    count = await db.scalar(
        select(func.count()).where(Task.user_id == user_id, Task.is_complete.is_(False))
    )
    return count or 0


async def list_tasks(user_id: int, db: AsyncSession) -> list[Task]:
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.is_complete.asc(), Task.urgency_score.desc().nulls_last(), Task.created_at.desc())
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
    workload = await _pending_count(user_id, db)
    score = compute_urgency(payload.deadline, workload)
    task = Task(
        user_id=user_id,
        meeting_note_id=payload.meeting_note_id,
        title=payload.title,
        assignee_name=payload.assignee_name,
        deadline=payload.deadline,
        priority=payload.priority,
        urgency_score=score,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def update_task(task_id: int, user_id: int, payload: TaskUpdate, db: AsyncSession) -> Task:
    task = await get_task(task_id, user_id, db)
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(task, field, value)
    if "deadline" in changes:
        workload = await _pending_count(user_id, db)
        task.urgency_score = compute_urgency(task.deadline, workload)
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
    workload = await _pending_count(user_id, db)
    tasks = [
        Task(
            user_id=user_id,
            meeting_note_id=note_id,
            title=p.title,
            assignee_name=p.assignee_name,
            deadline=p.deadline,
            priority=p.priority,
            urgency_score=compute_urgency(p.deadline, workload + i),
        )
        for i, p in enumerate(previews)
    ]
    db.add_all(tasks)
    await db.commit()
    for t in tasks:
        await db.refresh(t)
    return tasks
