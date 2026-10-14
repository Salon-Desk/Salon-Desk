from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    commission_rate: Decimal | None = Field(default=None, ge=0, le=1)


class ChangeRequestCreate(BaseModel):
    request_type: str
    payload_json: str


class OrganizationOut(BaseModel):
    id: UUID
    name: str
    slug: str
    is_approved: bool
    commission_rate: Decimal

    model_config = {"from_attributes": True}
