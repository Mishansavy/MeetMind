from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OtpRequest(BaseModel):
    email: EmailStr

class OtpVerify(BaseModel):
    email: EmailStr
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_email_verified: bool
    is_approved: bool
    employee_id: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    join_date: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    employee_id: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    join_date: Optional[date] = None


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    employee_id: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    join_date: Optional[date] = None