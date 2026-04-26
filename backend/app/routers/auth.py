from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import RegisterRequest, LoginRequest, TokenResponse
from app.services import auth_services

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register_user(payload, db)

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    return auth_service.verify_email(token, db)

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login_user(payload, db)