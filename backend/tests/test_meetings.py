"""Integration tests for meeting notes endpoints."""

from unittest.mock import patch
import io

import pytest

from app.models.user import User, UserRole
from app.utils.security import hash_password, create_access_token


async def make_user(db_session, email="notes@example.com"):
    user = User(
        name="Notes User",
        email=email,
        hashed_password=hash_password("password123"),
        is_email_verified=True,
        is_approved=True,
        role=UserRole.user,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


def auth_headers(user_id: int) -> dict:
    return {"Authorization": f"Bearer {create_access_token(str(user_id))}"}


class TestMeetingNotesCRUD:
    @pytest.mark.asyncio
    async def test_create_note(self, client, db_session):
        user = await make_user(db_session)
        resp = await client.post("/api/v1/meetings", json={
            "title": "Sprint planning", "content": "We will do X and Y.", "source": "text"
        }, headers=auth_headers(user.id))
        assert resp.status_code == 201
        assert resp.json()["title"] == "Sprint planning"

    @pytest.mark.asyncio
    async def test_list_notes_empty(self, client, db_session):
        user = await make_user(db_session, email="empty@example.com")
        resp = await client.get("/api/v1/meetings", headers=auth_headers(user.id))
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_list_notes_returns_own_notes_only(self, client, db_session):
        user_a = await make_user(db_session, email="a@example.com")
        user_b = await make_user(db_session, email="b@example.com")

        await client.post("/api/v1/meetings", json={
            "title": "A's note", "content": "Alice should do this.", "source": "text"
        }, headers=auth_headers(user_a.id))

        resp = await client.get("/api/v1/meetings", headers=auth_headers(user_b.id))
        assert resp.status_code == 200
        assert all(n["title"] != "A's note" for n in resp.json())

    @pytest.mark.asyncio
    async def test_get_note_by_id(self, client, db_session):
        user = await make_user(db_session, email="get@example.com")
        create = await client.post("/api/v1/meetings", json={
            "title": "Retro", "content": "Bob must follow up on items.", "source": "text"
        }, headers=auth_headers(user.id))
        note_id = create.json()["id"]

        resp = await client.get(f"/api/v1/meetings/{note_id}", headers=auth_headers(user.id))
        assert resp.status_code == 200
        assert resp.json()["id"] == note_id

    @pytest.mark.asyncio
    async def test_get_other_users_note_returns_404(self, client, db_session):
        owner = await make_user(db_session, email="owner@example.com")
        other = await make_user(db_session, email="other@example.com")

        create = await client.post("/api/v1/meetings", json={
            "title": "Private", "content": "Owner needs to review this.", "source": "text"
        }, headers=auth_headers(owner.id))
        note_id = create.json()["id"]

        resp = await client.get(f"/api/v1/meetings/{note_id}", headers=auth_headers(other.id))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_note(self, client, db_session):
        user = await make_user(db_session, email="del@example.com")
        create = await client.post("/api/v1/meetings", json={
            "title": "To delete", "content": "Carol will handle this item.", "source": "text"
        }, headers=auth_headers(user.id))
        note_id = create.json()["id"]

        resp = await client.delete(f"/api/v1/meetings/{note_id}", headers=auth_headers(user.id))
        assert resp.status_code == 204

        resp = await client.get(f"/api/v1/meetings/{note_id}", headers=auth_headers(user.id))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_unauthenticated_request_rejected(self, client):
        resp = await client.get("/api/v1/meetings")
        assert resp.status_code in (401, 403)
