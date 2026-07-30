from datetime import date, datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.attendance import Attendance
from app.models.user import User

router = APIRouter(prefix="/attendance", tags=["Attendance"])


class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    date: date
    check_in_at: Optional[datetime] = None
    check_out_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AdminAttendanceResponse(AttendanceResponse):
    user_name: str


async def _today_record(user_id: int, db: AsyncSession) -> Optional[Attendance]:
    today = datetime.now(timezone.utc).date()
    result = await db.execute(
        select(Attendance).where(Attendance.user_id == user_id, Attendance.date == today)
    )
    return result.scalar_one_or_none()


@router.get("/me/today", response_model=Optional[AttendanceResponse])
async def get_today_attendance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _today_record(current_user.id, db)


@router.post("/check-in", response_model=AttendanceResponse)
async def check_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await _today_record(current_user.id, db)
    if record and record.check_in_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already checked in today.")

    now = datetime.now(timezone.utc)
    if not record:
        record = Attendance(user_id=current_user.id, date=now.date(), check_in_at=now)
        db.add(record)
    else:
        record.check_in_at = now

    await db.commit()
    await db.refresh(record)
    return record


@router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await _today_record(current_user.id, db)
    if not record or not record.check_in_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must check in before checking out.")
    if record.check_out_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already checked out today.")

    record.check_out_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("", response_model=List[AdminAttendanceResponse])
async def list_attendance(
    for_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = select(Attendance, User.name).join(User, Attendance.user_id == User.id)
    if for_date:
        query = query.where(Attendance.date == for_date)
    query = query.order_by(Attendance.date.desc(), User.name)

    result = await db.execute(query)
    rows = result.all()
    return [
        AdminAttendanceResponse(
            id=a.id, user_id=a.user_id, date=a.date,
            check_in_at=a.check_in_at, check_out_at=a.check_out_at,
            user_name=user_name,
        )
        for a, user_name in rows
    ]
