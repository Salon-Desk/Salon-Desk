from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.schemas.working_hours import WorkingHoursSchema


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
    lat: Decimal | None = Field(default=None, ge=-90, le=90)
    lng: Decimal | None = Field(default=None, ge=-180, le=180)
    working_hours: WorkingHoursSchema | dict | None = None


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
    days: list[str] | None = None


class OrgEmployeeShiftUpdate(BaseModel):
    org_shift_id: UUID | None = None
    days: list[str] | None = None


class OrgEmployeeShiftOut(ORMModel):
    id: UUID
    user_id: UUID
    org_shift_id: UUID
    days: list[str] = ["monday", "tuesday", "wednesday", "thursday", "friday"]
    created_at: datetime
    employee_name: str | None = None
    employee_email: str | None = None
    shift_name: str | None = None
    shift_data: dict | None = None


class OrgEmployeeTimeOffCreate(BaseModel):
    user_id: UUID
    start_date: date
    end_date: date
    reason: str | None = None


class OrgEmployeeTimeOffOut(ORMModel):
    id: UUID
    org_id: UUID
    user_id: UUID
    start_date: date
    end_date: date
    reason: str | None = None
    created_at: datetime
    employee_name: str | None = None
    employee_email: str | None = None


class CancellationPolicyCreate(BaseModel):
    name: str = "Standard Cancellation Policy"
    data: dict


class CancellationPolicyOut(ORMModel):
    id: UUID
    org_id: UUID
    name: str
    status: str
    data: dict
    org_name: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class OrgAccountCreate(BaseModel):
    merchant_id: str
    merchant_email: str | None = None
    display_name: str | None = None
    currency: str = "USD"


class OrgAccountOut(ORMModel):
    id: UUID
    org_id: UUID
    merchant_id: str
    merchant_email: str | None = None
    display_name: str
    currency: str
    status: str
    approved_at: datetime | None = None
    org_name: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


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
    org_name: str | None = None
    submitter_name: str | None = None


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
    rating_avg: float = 0.0
    review_count: int = 0
    working_hours: dict | None = None
    distance_km: float | None = None


class CatalogHeroOut(BaseModel):
    """Marketplace landing hero — assembled from live org/service data."""

    eyebrow: str
    headline: str
    highlight: str
    subtitle: str
    image_url: str | None = None
    image_alt: str
    organization_id: UUID | None = None
    organization_name: str | None = None
    physical_address: str | None = None
    salon_count: int = 0
    service_count: int = 0


class CatalogCancellationPolicyOut(BaseModel):
    """Public booking-time policy preview (same fields locked into booking snapshots)."""

    org_id: UUID
    name: str
    free_cancel_hours: float = 24
    no_show_fee_percent: float = 50
    late_cancel_fee_percent: float | None = None
    data: dict = {}


class AdminOrgOwnerOut(BaseModel):
    id: UUID
    email: str
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    status: str
    role: str
    created_at: datetime | None = None


class AdminOrgPaypalOut(BaseModel):
    id: UUID | None = None
    merchant_id: str | None = None
    merchant_email: str | None = None
    display_name: str | None = None
    currency: str = "USD"
    status: str | None = None
    approved_at: datetime | None = None
    created_at: datetime | None = None


class AdminOrgServiceItem(BaseModel):
    id: UUID
    name: str
    category_name: str | None = None
    base_price: Decimal
    duration_minutes: int
    status: str
    simultaneous_capacity: int = 1


class AdminOrgStaffItem(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    role: str
    picture: str | None = None
    phone: str | None = None


class AdminOrganizationDetailOut(ORMModel):
    id: UUID
    owner_id: UUID
    name: str
    status: str
    description: str | None = None
    picture: str | None = None
    created_at: datetime
    owner: AdminOrgOwnerOut | None = None
    paypal_account: AdminOrgPaypalOut | None = None
    physical_address: str | None = None
    timezone: str | None = None
    lat: Decimal | None = None
    lng: Decimal | None = None
    working_hours: dict | None = None
    cancellation_policy: CatalogCancellationPolicyOut | None = None
    rating_avg: float = 0.0
    review_count: int = 0
    services_count: int = 0
    staff_count: int = 0
    services: list[AdminOrgServiceItem] = []
    staff: list[AdminOrgStaffItem] = []
