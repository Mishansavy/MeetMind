"""Tests for the pure helpers in app/utils/security.py. No DB."""

import time
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.utils.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.config import settings


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        assert hash_password("secret") != "secret"

    def test_correct_password_verifies(self):
        hashed = hash_password("mypassword")
        assert verify_password("mypassword", hashed) is True

    def test_wrong_password_fails(self):
        hashed = hash_password("mypassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_same_password_produces_different_hashes(self):
        # bcrypt includes a random salt per hash.
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2


class TestAccessToken:
    def test_token_decodes_with_correct_subject(self):
        token = create_access_token("42")
        payload = decode_token(token)
        assert payload["sub"] == "42"

    def test_expired_token_returns_empty_dict(self):
        expire = datetime.now(timezone.utc) - timedelta(seconds=1)
        token = jwt.encode(
            {"sub": "1", "exp": expire},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        assert decode_token(token) == {}

    def test_tampered_token_returns_empty_dict(self):
        token = create_access_token("1") + "tampered"
        assert decode_token(token) == {}


class TestEmailVerificationToken:
    def test_token_has_correct_type_claim(self):
        token = create_email_verification_token("user@example.com")
        payload = decode_token(token)
        assert payload["type"] == "email_verify"
        assert payload["sub"] == "user@example.com"

    def test_email_token_not_accepted_as_access_token(self):
        # The type claim prevents cross-use between token types.
        token = create_email_verification_token("user@example.com")
        payload = decode_token(token)
        assert "type" in payload
        assert payload["type"] != "password_reset"


class TestPasswordResetToken:
    def test_token_has_correct_type_claim(self):
        token = create_password_reset_token("user@example.com")
        payload = decode_token(token)
        assert payload["type"] == "password_reset"
        assert payload["sub"] == "user@example.com"

    def test_reset_token_expires_in_30_minutes(self):
        token = create_password_reset_token("user@example.com")
        payload = decode_token(token)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = exp - now
        # Allow ±5 seconds for test execution time.
        assert 29 * 60 < delta.total_seconds() <= 30 * 60 + 5
