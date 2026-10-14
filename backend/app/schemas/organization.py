from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORMModel


class OrganizationCreate(BaseModel):
    name: str
    description: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    picture: str | None = None


class OrganizationOut(ORMModel):
    id: UUID
    owner_id: UUID
    name: str
    status: str
    description: str | None = None
    picture: str | None = None
    created_at: datetime


class OrgSettingsUpdate(BaseModel):
    timezone: str | None = None
    physical_address: str | None = None
    lat: Decimal | None = None
    lng: Decimal | None = None
    working_hours: dict | None = None


class OrgSettingsOut(ORMModel):
    id: UUID
    org_id: UUID
    timezone: str
    physical_address: str
    lat: Decimal | None = None
    lng: Decimal | None = None
    working_hours: dict


class OrgShiftCreate(BaseModel):
    name: str
    data: dict


class OrgShiftUpdate(BaseModel):
    name: str | None = None
    data: dict | None = None


class OrgShiftOut(ORMModel):
    id: UUID
    org_id: UUID
    name: str
    data: dict


class OrgEmployeeShiftCreate(BaseModel):
    user_id: UUID
    org_shift_id: UUID


class OrgEmployeeShiftOut(ORMModel):
    id: UUID
    user_id: UUID
    org_shift_id: UUID
    created_at: datetime


class CancellationPolicyOut(ORMModel):
    id: UUID
    org_id: UUID
    name: str
    status: str
    data: dict


class OrgAccountOut(ORMModel):
    id: UUID
    org_id: UUID
    merchant_id: str
    merchant_email: str | None = None
    display_name: str
    currency: str
    status: str
    approved_at: datetime | None = None


class ChangeRequestCreate(BaseModel):
    request_type: str
    payload_json: dict
    current_snapshot_json: dict


class ChangeRequestOut(ORMModel):
    id: UUID
    org_id: UUID
    request_type: str
    payload_json: dict
    current_snapshot_json: dict
    status: str
    submitted_by: UUID
    reviewed_by: UUID | None = None
    review_notes: str | None = None
    created_at: datetime
    reviewed_at: datetime | None = None


class ChangeRequestReview(BaseModel):
    review_notes: str | None = None


class CatalogOrganizationOut(ORMModel):
    id: UUID
    name: str
    description: str | None = None
    picture: str | None = None
    physical_address: str | None = None
    lat: Decimal | None = None
    lng: Decimal | None = None
    timezone: str | None = None
