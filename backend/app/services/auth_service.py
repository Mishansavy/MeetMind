from fastapi import HTTPException, status
from sqlalchemy.orm import session

from app.models.user import User
from app.schemas.user import RegisterRequest, LoginRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_email_verification_token,
)
from app.services.email_service import send_verification_email

def register_user(payload: RegisterRequest, db: Session) -> dict:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )
    
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_email_verification_token(user.email)
    send_verification_email(user.email, token)

    return {"message": "Registration successful. Please verify your email."}

def verify_email(token: str, db: Session) -> dict:
    from app.utils.security. import decode_token

    payload = decode_token(token)
    if not payload or payload.get("type") != "email_verify":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link.",
        )

    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_email_verified:
        return {"message": "Email already verified."}

    user.is_email_verified = True
    db.commit()

    return {"message": "Email verified. Awaiting admin approval."}

def login_user(payload: LoginRequest, db: Session) -> dict:
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in.",
        )
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your accont is pending admin approval.",
        )

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}