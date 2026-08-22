"""Create the admin user from ADMIN_* env vars. Safe to re-run."""
import asyncio
import os

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.utils.security import hash_password


async def seed():
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    if not email or not password:
        raise SystemExit("Set ADMIN_EMAIL and ADMIN_PASSWORD before running seed.py")

    async with AsyncSessionLocal() as db:
        existing = (await db.execute(
            select(User).where(User.email == email)
        )).scalar_one_or_none()

        if existing:
            print(f"[skip] {email} already exists (id={existing.id})")
            return

        user = User(
            name=os.environ.get("ADMIN_NAME", "MeetMind Root"),
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.admin,
            is_active=True,
            is_email_verified=True,
            is_approved=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print(f"[created] admin {user.email} (id={user.id})")


if __name__ == "__main__":
    asyncio.run(seed())
