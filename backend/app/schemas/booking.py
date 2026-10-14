from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class BookingCreate(BaseModel):
    service_id: UUID
    stylist_id: UUID | None = None
    starts_at: datetime
    customer_name: str | None = None
    customer_notes: str | None = None


class TimeSlot(BaseModel):
    starts_at: datetime
    ends_at: datetime
    available: bool = True


class BookingOut(BaseModel):
    id: UUID
    service_id: UUID
    starts_at: datetime
    ends_at: datetime
    status: str

    model_config = {"from_attributes": True}
