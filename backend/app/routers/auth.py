from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.register_user(payload, db)


@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    return await auth_service.verify_email(token, db)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.login_user(payload, db)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/me/stats")
async def me_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.meeting import MeetingNote
    from app.models.task import Task

    notes_count = await db.scalar(
        select(func.count()).where(MeetingNote.user_id == current_user.id)
    )
    tasks_pending = await db.scalar(
        select(func.count()).where(Task.user_id == current_user.id, Task.is_complete.is_(False))
    )
    return {
        "meetings": notes_count or 0,
        "tasks_pending": tasks_pending or 0,
    }
