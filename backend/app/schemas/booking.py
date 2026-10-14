from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class BookingServiceItem(BaseModel):
    service_id: UUID


class BookingCreate(BaseModel):
    org_id: UUID
    stylist_id: UUID | None = None
    starts_at: datetime
    service_ids: list[UUID] = Field(min_length=1)
    customer_notes: str | None = None


class BookingCancelRequest(BaseModel):
    reason: str | None = None


class ConsentCreate(BaseModel):
    terms_version: str
    terms_text: str
    signed_payload: str


class ConsentOut(ORMModel):
    id: UUID
    booking_id: UUID
    client_id: UUID
    terms_version: str
    terms_text_hash: str
    created_at: datetime


class TimeSlot(BaseModel):
    starts_at: datetime
    ends_at: datetime
    available: bool = True


class BookingServiceOut(ORMModel):
    id: UUID
    booking_id: UUID
    service_id: UUID
    base_price: Decimal


class BookingOut(ORMModel):
    id: UUID
    org_id: UUID
    client_id: UUID
    stylist_id: UUID | None = None
    starts_at: datetime
    ends_at: datetime
    status: str
    cancellation_fee_json: dict | None = None
    cancellation_reason: str | None = None
    total_price: Decimal
    commission_snapshot: dict
    customer_notes: str | None = None
    created_at: datetime
    booking_services: list[BookingServiceOut] = []
