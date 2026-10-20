from uuid import UUID

import email_validator
from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import ProfileOut, UserOut

if "local" in email_validator.SPECIAL_USE_DOMAIN_NAMES:
    email_validator.SPECIAL_USE_DOMAIN_NAMES.remove("local")


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    middle_name: str | None = None
    phone: str | None = None


class OrgOwnerSignUpRequest(SignUpRequest):
    organization_name: str
    organization_description: str | None = None
    timezone: str = "UTC"
    physical_address: str
    lat: float | None = None
    lng: float | None = None
    working_hours: dict = Field(
        default_factory=lambda: {
            "mon": [["09:00", "17:00"]],
            "tue": [["09:00", "17:00"]],
            "wed": [["09:00", "17:00"]],
            "thu": [["09:00", "17:00"]],
            "fri": [["09:00", "17:00"]],
            "sat": [["10:00", "14:00"]],
            "sun": [],
        }
    )


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    detail: str
    reset_token: str | None = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class MeResponse(BaseModel):
    user: UserOut
    profile: ProfileOut | None = None


class OrgOwnerSignUpResponse(TokenResponse):
    organization_id: UUID
