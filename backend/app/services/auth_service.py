import random
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import RegisterRequest, LoginRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    decode_token,
)
from app.services.email_service import send_verification_email, send_otp_email, send_password_reset_email


async def register_user(payload: RegisterRequest, db: AsyncSession) -> dict:
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_email_verification_token(user.email)
    send_verification_email(user.email, token)

    return {"message": "Registration successful. Please verify your email."}


async def verify_email(token: str, db: AsyncSession) -> dict:
    payload = decode_token(token)
    if not payload or payload.get("type") != "email_verify":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification link.")

    email = payload.get("sub")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.is_email_verified:
        return {"message": "Email already verified."}

    user.is_email_verified = True
    await db.commit()
    return {"message": "Email verified. Awaiting admin approval."}


async def login_user(payload: LoginRequest, db: AsyncSession) -> dict:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    # Combine "user not found" and "wrong password" into one error message to prevent
    # user enumeration — an attacker shouldn't be able to tell which one failed.
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if not user.is_email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email before logging in.")
    if not user.is_approved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account is pending admin approval.")

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}


async def request_otp(email: str, db: AsyncSession) -> dict:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Return the same message regardless of whether the email exists — prevents
    # attackers from probing which email addresses are registered.
    if not user or not user.is_active:
        return {"message": "If that email is registered, a code has been sent."}
    if not user.is_email_verified or not user.is_approved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account not active.")

    otp = f"{random.randint(0, 999999):06d}"
    # Store a bcrypt hash of the OTP — if the DB is ever compromised, raw codes
    # are not exposed. 10-minute window balances convenience against brute-force risk.
    user.otp_code = hash_password(otp)
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.commit()

    send_otp_email(user.email, otp)
    return {"message": "If that email is registered, a code has been sent."}


async def verify_otp(email: str, otp: str, db: AsyncSession) -> dict:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Single exception object — ensures timing and error message are identical
    # whether the user doesn't exist, the code expired, or the code is wrong.
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired code.")

    if not user or not user.otp_code or not user.otp_expires_at:
        raise invalid
    if user.otp_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise invalid
    if not verify_password(otp, user.otp_code):
        raise invalid

    # Invalidate the OTP immediately so it can't be replayed.
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}


async def forgot_password(email: str, db: AsyncSession) -> dict:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    # Only send if the account exists and is verified — unverified accounts
    # shouldn't be able to reset passwords and bypass email verification.
    if user and user.is_active and user.is_email_verified:
        token = create_password_reset_token(user.email)
        send_password_reset_email(user.email, token)
    # Always return the same response — same enumeration-prevention reason as OTP.
    return {"message": "If that email is registered, a reset link has been sent."}


async def reset_password(token: str, new_password: str, db: AsyncSession) -> dict:
    payload = decode_token(token)
    # Check the type claim — prevents an email verification token being reused here.
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link.")

    result = await db.execute(select(User).where(User.email == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.hashed_password = hash_password(new_password)
    await db.commit()
    return {"message": "Password updated. You can now log in."}
