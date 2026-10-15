from datetime import datetime
from uuid import UUID

import email_validator
from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel

if "local" in email_validator.SPECIAL_USE_DOMAIN_NAMES:
    email_validator.SPECIAL_USE_DOMAIN_NAMES.remove("local")


class ProfileOut(ORMModel):
    id: UUID
    user_id: UUID
    first_name: str
    last_name: str
    middle_name: str | None = None
    picture: str | None = None
    phone: str | None = None


class ProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    picture: str | None = None
    phone: str | None = None


class UserOut(ORMModel):
    id: UUID
    email: EmailStr
    status: str
    role: str
    org_id: UUID | None = None
    created_at: datetime
    profile: ProfileOut | None = None


class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    middle_name: str | None = None
    phone: str | None = None
    role: str = Field(description="reception or stylist")


class StaffCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    middle_name: str | None = None
    phone: str | None = None
