from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.meeting import MeetingNote
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/meetings-per-week")
async def meetings_per_week(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Last 8 ISO weeks, group by week start (Monday)
    cutoff = date.today() - timedelta(weeks=8)
    result = await db.execute(
        select(
            func.date_trunc("week", MeetingNote.created_at).label("week"),
            func.count().label("count"),
        )
        .where(MeetingNote.user_id == current_user.id, MeetingNote.created_at >= cutoff)
        .group_by("week")
        .order_by("week")
    )
    rows = result.all()
    return [{"week": str(r.week.date()), "count": r.count} for r in rows]


@router.get("/task-completion")
async def task_completion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=30)

    total_result = await db.execute(
        select(
            func.date_trunc("day", Task.created_at).label("day"),
            func.count().label("total"),
        )
        .where(Task.user_id == current_user.id, Task.created_at >= cutoff)
        .group_by("day")
        .order_by("day")
    )

    done_result = await db.execute(
        select(
            func.date_trunc("day", Task.updated_at).label("day"),
            func.count().label("completed"),
        )
        .where(
            Task.user_id == current_user.id,
            Task.is_complete.is_(True),
            Task.updated_at >= cutoff,
        )
        .group_by("day")
        .order_by("day")
    )

    total_by_day = {str(r.day.date()): r.total for r in total_result.all()}
    done_by_day = {str(r.day.date()): r.completed for r in done_result.all()}

    all_days = sorted(set(total_by_day) | set(done_by_day))
    return [
        {
            "date": d,
            "total": total_by_day.get(d, 0),
            "completed": done_by_day.get(d, 0),
        }
        for d in all_days
    ]


@router.get("/workload")
async def workload(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(func.count().label("pending"))
        .where(Task.user_id == current_user.id, Task.is_complete.is_(False))
    )
    pending = result.scalar() or 0
    done_result = await db.execute(
        select(func.count().label("done"))
        .where(Task.user_id == current_user.id, Task.is_complete.is_(True))
    )
    done = done_result.scalar() or 0
    return {"pending": pending, "completed": done, "total": pending + done}
