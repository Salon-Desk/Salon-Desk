from __future__ import annotations

from datetime import datetime
from typing import Any
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
    handle: str | None = None


class ProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    picture: str | None = None
    phone: str | None = None
    handle: str | None = None


class UserOut(ORMModel):
    id: UUID
    email: EmailStr
    status: str
    role: str
    org_id: UUID | None = None
    email_verified_at: datetime | None = None
    created_at: datetime
    profile: ProfileOut | None = None
    category_ids: list[UUID] = []

    @classmethod
    def from_user(cls, user: Any) -> UserOut:
        return cls.model_validate(user)


class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    middle_name: str | None = None
    phone: str | None = None
    role: str = Field(description="reception or stylist")
    handle: str | None = None
    category_ids: list[UUID] | None = None


class EmployeeUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    phone: str | None = None
    role: str | None = Field(default=None, description="reception or stylist")
    picture: str | None = None
    handle: str | None = None
    category_ids: list[UUID] | None = None


class EmployeeCategoriesUpdate(BaseModel):
    category_ids: list[UUID]


class EmployeeCategoryOut(ORMModel):
    id: UUID
    name: str
    description: str | None = None


class StaffCreate(BaseModel):
    email: EmailStr
    password: str | None = Field(
        default=None,
        min_length=8,
        description="Optional. If omitted, an 8-char password is auto-generated.",
    )
    first_name: str
    last_name: str
    middle_name: str | None = None
    phone: str | None = None
