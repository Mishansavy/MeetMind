"""Integration tests for task endpoints and extraction."""

import pytest

from app.models.user import User, UserRole
from app.utils.security import hash_password, create_access_token


async def make_user(db_session, email="tasks@example.com"):
    user = User(
        name="Task User",
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


async def make_note(client, user_id, content="Alice should review the PR."):
    resp = await client.post("/api/v1/meetings", json={
        "title": "Test note", "content": content, "source": "text"
    }, headers=auth_headers(user_id))
    return resp.json()["id"]


def auth_headers(user_id: int) -> dict:
    return {"Authorization": f"Bearer {create_access_token(str(user_id))}"}


class TestTaskCRUD:
    @pytest.mark.asyncio
    async def test_create_task(self, client, db_session):
        user = await make_user(db_session)
        resp = await client.post("/api/v1/tasks", json={
            "title": "Write tests", "priority": "medium"
        }, headers=auth_headers(user.id))
        assert resp.status_code == 201
        assert resp.json()["title"] == "Write tests"

    @pytest.mark.asyncio
    async def test_list_tasks_empty(self, client, db_session):
        user = await make_user(db_session, email="listempty@example.com")
        resp = await client.get("/api/v1/tasks", headers=auth_headers(user.id))
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_tasks_are_user_scoped(self, client, db_session):
        user_a = await make_user(db_session, email="ta@example.com")
        user_b = await make_user(db_session, email="tb@example.com")

        await client.post("/api/v1/tasks", json={"title": "A's task", "priority": "low"},
                          headers=auth_headers(user_a.id))

        resp = await client.get("/api/v1/tasks", headers=auth_headers(user_b.id))
        assert all(t["title"] != "A's task" for t in resp.json())

    @pytest.mark.asyncio
    async def test_update_task_complete(self, client, db_session):
        user = await make_user(db_session, email="update@example.com")
        create = await client.post("/api/v1/tasks", json={
            "title": "Complete me", "priority": "high"
        }, headers=auth_headers(user.id))
        task_id = create.json()["id"]

        resp = await client.patch(f"/api/v1/tasks/{task_id}", json={"is_complete": True},
                                  headers=auth_headers(user.id))
        assert resp.status_code == 200
        assert resp.json()["is_complete"] is True

    @pytest.mark.asyncio
    async def test_delete_task(self, client, db_session):
        user = await make_user(db_session, email="deltask@example.com")
        create = await client.post("/api/v1/tasks", json={
            "title": "Delete me", "priority": "low"
        }, headers=auth_headers(user.id))
        task_id = create.json()["id"]

        resp = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers(user.id))
        assert resp.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_other_users_task_returns_404(self, client, db_session):
        owner = await make_user(db_session, email="towner@example.com")
        other = await make_user(db_session, email="tother@example.com")

        create = await client.post("/api/v1/tasks", json={
            "title": "Owner task", "priority": "medium"
        }, headers=auth_headers(owner.id))
        task_id = create.json()["id"]

        resp = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers(other.id))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_urgency_score_present_on_created_task(self, client, db_session):
        user = await make_user(db_session, email="urgency@example.com")
        resp = await client.post("/api/v1/tasks", json={
            "title": "Check urgency", "priority": "medium"
        }, headers=auth_headers(user.id))
        assert "urgency_score" in resp.json()


class TestTaskExtraction:
    @pytest.mark.asyncio
    async def test_extract_returns_previews(self, client, db_session):
        user = await make_user(db_session, email="extract@example.com")
        note_id = await make_note(client, user.id, content="Alice should review the PR by Friday.")

        resp = await client.post(f"/api/v1/meetings/{note_id}/extract",
                                 headers=auth_headers(user.id))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_extract_from_other_users_note_returns_404(self, client, db_session):
        owner = await make_user(db_session, email="extowner@example.com")
        other = await make_user(db_session, email="extother@example.com")
        note_id = await make_note(client, owner.id)

        resp = await client.post(f"/api/v1/meetings/{note_id}/extract",
                                 headers=auth_headers(other.id))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_bulk_save_creates_tasks(self, client, db_session):
        user = await make_user(db_session, email="bulk@example.com")
        note_id = await make_note(client, user.id, content="Bob must finish the report today.")

        previews = await client.post(f"/api/v1/meetings/{note_id}/extract",
                                     headers=auth_headers(user.id))
        items = previews.json()

        resp = await client.post(f"/api/v1/meetings/{note_id}/tasks",
                                 json=items, headers=auth_headers(user.id))
        assert resp.status_code == 201
        assert len(resp.json()) == len(items)
