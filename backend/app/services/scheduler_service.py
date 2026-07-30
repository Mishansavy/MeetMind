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

# Module-level scheduler instance, shared across the app lifespan.
scheduler = AsyncIOScheduler()


async def send_task_reminders() -> None:
    """Query all incomplete tasks due tomorrow and email each owner a reminder.

    Opens its own DB session rather than using FastAPI's Depends(get_db) because
    APScheduler jobs run outside the request lifecycle, there's no active request
    to inject a session into.
    """
    tomorrow = date.today() + timedelta(days=1)
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Task)
            .options(joinedload(Task.user))  # avoids N+1 when emailing each owner
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
            # Log and continue, one failed email shouldn't stop the rest.
            logger.exception("Failed to send reminder for task %d", task.id)


def start_scheduler() -> None:
    scheduler.add_job(
        send_task_reminders,
        CronTrigger(hour=8, minute=0),
        id="task_reminders",
        replace_existing=True,  # safe to call on hot-reload without duplicate jobs
    )
    scheduler.start()


def stop_scheduler() -> None:
    # wait=False prevents blocking the server shutdown while in-flight jobs finish.
    scheduler.shutdown(wait=False)
