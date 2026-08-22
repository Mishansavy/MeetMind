import logging
from datetime import date, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database import AsyncSessionLocal
from app.models.task import Task
from app.services.email_service import send_reminder_email

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def send_task_reminders() -> None:
    """Email each owner of an incomplete task due tomorrow.

    Opens its own session: scheduler jobs run outside the request lifecycle."""
    tomorrow = date.today() + timedelta(days=1)
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Task)
            .options(joinedload(Task.user))  # avoid N+1 when emailing owners
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
            # one bad address shouldn't stop the rest
            logger.exception("Failed to send reminder for task %d", task.id)


def start_scheduler() -> None:
    scheduler.add_job(
        send_task_reminders,
        CronTrigger(hour=8, minute=0),
        id="task_reminders",
        replace_existing=True,  # no duplicate jobs on hot-reload
    )
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)  # don't block shutdown on in-flight jobs
