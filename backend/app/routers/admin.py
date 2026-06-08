from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.task import Task, TaskPriority
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


class AdminTaskResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    meeting_note_id: Optional[int]
    title: str
    assignee_name: Optional[str]
    deadline: Optional[str]
    priority: TaskPriority
    is_complete: bool
    urgency_score: Optional[float]

    model_config = {"from_attributes": True}


@router.get("/users/pending", response_model=List[UserResponse])
async def list_pending_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(User).where(
            User.is_email_verified.is_(True),
            User.is_approved.is_(False),
            User.is_active.is_(True),
        )
    )
    return result.scalars().all()


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.is_active.is_(True)))
    return result.scalars().all()


@router.post("/users/{user_id}/approve", response_model=UserResponse)
async def approve_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.is_approved = True
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
async def remove_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own account.",
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.is_active = False
    await db.commit()


@router.get("/tasks", response_model=List[AdminTaskResponse])
async def list_all_tasks(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(Task, User.name).join(User, Task.user_id == User.id).order_by(Task.created_at.desc())
    )
    rows = result.all()
    out = []
    for task, user_name in rows:
        out.append(AdminTaskResponse(
            id=task.id,
            user_id=task.user_id,
            user_name=user_name,
            meeting_note_id=task.meeting_note_id,
            title=task.title,
            assignee_name=task.assignee_name,
            deadline=task.deadline.isoformat() if task.deadline else None,
            priority=task.priority,
            is_complete=task.is_complete,
            urgency_score=task.urgency_score,
        ))
    return out
