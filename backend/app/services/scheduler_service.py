import logging
from datetime import date, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database import AsyncSessionLocal
from app.models.task import Task
from app.models.user import User
from app.services.email_service import send_reminder_email

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def send_task_reminders() -> None:
    tomorrow = date.today() + timedelta(days=1)
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Task)
            .options(joinedload(Task.user))
            .where(Task.deadline == tomorrow, Task.is_complete.is_(False))
        )
        tasks = result.scalars().all()

    for task in tasks:
        try:
            send_reminder_email(
                to_email=task.user.email,
                name=task.user.name,
                task_title=task.title,
                deadline=task.deadline,
            )
        except Exception:
            logger.exception("Failed to send reminder for task %d", task.id)


def start_scheduler() -> None:
    scheduler.add_job(
        send_task_reminders,
        CronTrigger(hour=8, minute=0),
        id="task_reminders",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
