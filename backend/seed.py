"""Create the admin user if it does not exist. Safe to re-run."""
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.utils.security import hash_password


ADMINS = [
    {
        "name": "MeetMind Root",
        "email": "meetmind-root@meetmind.com",
        "password": "REDACTED",
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        for data in ADMINS:
            existing = (await db.execute(
                select(User).where(User.email == data["email"])
            )).scalar_one_or_none()

            if existing:
                print(f"[skip] {data['email']} already exists (id={existing.id})")
                continue

            user = User(
                name=data["name"],
                email=data["email"],
                hashed_password=hash_password(data["password"]),
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
