"""Integration tests for the auth endpoints, against real Postgres."""

from unittest.mock import patch

import pytest

from app.models.user import User, UserRole
from app.utils.security import hash_password, create_access_token


# Helpers

async def make_user(db_session, email="test@example.com", password="password123",
                    verified=True, approved=True, role=UserRole.user):
    user = User(
        name="Test User",
        email=email,
        hashed_password=hash_password(password),
        is_email_verified=verified,
        is_approved=approved,
        role=role,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


def auth_headers(user_id: int) -> dict:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


# Registration

class TestRegister:
    @pytest.mark.asyncio
    async def test_register_success(self, client):
        with patch("app.services.auth_service.send_verification_email"):
            resp = await client.post("/api/v1/auth/register", json={
                "name": "Alice", "email": "alice@example.com", "password": "secret123"
            })
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client, db_session):
        await make_user(db_session, email="dup@example.com")
        with patch("app.services.auth_service.send_verification_email"):
            resp = await client.post("/api/v1/auth/register", json={
                "name": "Bob", "email": "dup@example.com", "password": "secret123"
            })
        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_register_short_password_rejected(self, client):
        resp = await client.post("/api/v1/auth/register", json={
            "name": "Carol", "email": "carol@example.com", "password": "short"
        })
        assert resp.status_code == 422


# Login

class TestLogin:
    @pytest.mark.asyncio
    async def test_login_success_returns_token(self, client, db_session):
        await make_user(db_session, email="login@example.com", password="mypass123")
        resp = await client.post("/api/v1/auth/login", json={
            "email": "login@example.com", "password": "mypass123"
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client, db_session):
        await make_user(db_session, email="wrong@example.com", password="correct")
        resp = await client.post("/api/v1/auth/login", json={
            "email": "wrong@example.com", "password": "incorrect"
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_login_unverified_user_rejected(self, client, db_session):
        await make_user(db_session, email="unverified@example.com", verified=False)
        resp = await client.post("/api/v1/auth/login", json={
            "email": "unverified@example.com", "password": "password123"
        })
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_login_unapproved_user_rejected(self, client, db_session):
        await make_user(db_session, email="unapproved@example.com", approved=False)
        resp = await client.post("/api/v1/auth/login", json={
            "email": "unapproved@example.com", "password": "password123"
        })
        assert resp.status_code == 403


# /auth/me

class TestMe:
    @pytest.mark.asyncio
    async def test_me_returns_user_data(self, client, db_session):
        user = await make_user(db_session, email="me@example.com")
        resp = await client.get("/api/v1/auth/me", headers=auth_headers(user.id))
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@example.com"

    @pytest.mark.asyncio
    async def test_me_without_token_returns_403(self, client):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code in (401, 403)


# OTP

class TestOtp:
    @pytest.mark.asyncio
    async def test_otp_request_returns_generic_message(self, client):
        # Should return success even for non-existent email, prevents enumeration.
        with patch("app.services.auth_service.send_otp_email"):
            resp = await client.post("/api/v1/auth/otp/request", json={"email": "nobody@example.com"})
        assert resp.status_code == 200
        assert "code has been sent" in resp.json()["message"]

    @pytest.mark.asyncio
    async def test_otp_verify_wrong_code(self, client, db_session):
        user = await make_user(db_session, email="otp@example.com")
        with patch("app.services.auth_service.send_otp_email"):
            await client.post("/api/v1/auth/otp/request", json={"email": "otp@example.com"})
        resp = await client.post("/api/v1/auth/otp/verify", json={
            "email": "otp@example.com", "otp": "000000"
        })
        assert resp.status_code == 401


# Forgot / Reset Password

class TestForgotReset:
    @pytest.mark.asyncio
    async def test_forgot_password_generic_response(self, client):
        with patch("app.services.auth_service.send_password_reset_email"):
            resp = await client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
        assert resp.status_code == 200
        assert "reset link" in resp.json()["message"]

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(self, client):
        resp = await client.post("/api/v1/auth/reset-password", json={
            "token": "not-a-real-token", "new_password": "newpassword123"
        })
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_reset_password_with_email_verify_token_rejected(self, client, db_session):
        from app.utils.security import create_email_verification_token
        # A verification token must not be accepted by the reset-password endpoint.
        token = create_email_verification_token("test@example.com")
        resp = await client.post("/api/v1/auth/reset-password", json={
            "token": token, "new_password": "newpassword123"
        })
        assert resp.status_code == 400
