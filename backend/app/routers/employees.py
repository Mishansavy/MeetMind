import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.schemas.user import EmployeeCreate, EmployeeUpdate, UserResponse
from app.services.email_service import send_employee_invite_email
from app.utils.security import create_invite_token, hash_password

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.post("", response_model=UserResponse, status_code=201)
async def create_employee(
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    # random unusable password until the employee sets their own via the invite link
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(secrets.token_urlsafe(32)),
        is_email_verified=True,
        is_approved=True,
        employee_id=payload.employee_id,
        department=payload.department,
        designation=payload.designation,
        join_date=payload.join_date,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_invite_token(user.email)
    send_employee_invite_email(user.email, user.name, token)

    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_employee(
    user_id: int,
    payload: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None and payload.email != user.email:
        existing = await db.execute(select(User).where(User.email == payload.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
        user.email = payload.email
        # changing the login email means it hasn't been proven to belong to them yet
        user.is_email_verified = False
    if payload.employee_id is not None:
        user.employee_id = payload.employee_id
    if payload.department is not None:
        user.department = payload.department
    if payload.designation is not None:
        user.designation = payload.designation
    if payload.join_date is not None:
        user.join_date = payload.join_date

    await db.commit()
    await db.refresh(user)
    return user
