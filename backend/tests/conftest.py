"""Shared fixtures. Each test gets its own engine and a transaction rolled back
on teardown. The test DB is created via psycopg2 to dodge asyncpg event-loop
scoping at session level."""

import os

import psycopg2
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

DB_USER = os.environ.get("PGUSER") or os.environ.get("USER", "postgres")

# must precede any app import that reads settings
os.environ.setdefault("DATABASE_URL", f"postgresql://{DB_USER}@localhost:5432/meetmind_test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("SMTP_HOST", "smtp.gmail.com")
os.environ.setdefault("SMTP_PORT", "587")
os.environ.setdefault("SMTP_USER", "test@example.com")
os.environ.setdefault("SMTP_PASSWORD", "test")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = f"postgresql+asyncpg://{DB_USER}@localhost:5432/meetmind_test"


def pytest_configure(config):
    """Create the test database once, before any test runs."""
    conn = psycopg2.connect(user=DB_USER, dbname="postgres", host="localhost", port=5432)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'meetmind_test'")
    if not cur.fetchone():
        cur.execute("CREATE DATABASE meetmind_test")
    cur.close()
    conn.close()


@pytest_asyncio.fixture
async def db_session():
    """Fresh engine and rolled-back transaction per test."""
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as setup_conn:
        await setup_conn.run_sync(Base.metadata.create_all)

    async with engine.connect() as conn:
        await conn.begin()
        session = AsyncSession(bind=conn, expire_on_commit=False)
        yield session
        await session.close()
        await conn.rollback()

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    """AsyncClient bound to the app with the test session injected."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
