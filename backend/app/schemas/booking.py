from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class BookingServiceItem(BaseModel):
    service_id: UUID


class ServiceStylistSelection(BaseModel):
    service_id: UUID
    stylist_id: UUID | None = None


class BookingCreate(BaseModel):
    org_id: UUID
    stylist_id: UUID | None = None
    starts_at: datetime
    service_ids: list[UUID] = Field(min_length=1)
    service_stylists: list[ServiceStylistSelection] = []
    party_size: int = Field(default=1, ge=1, le=10)
    customer_notes: str | None = None


class BookingCancelRequest(BaseModel):
    reason: str | None = None


class BookingRescheduleRequest(BaseModel):
    starts_at: datetime
    stylist_id: UUID | None = None


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


class AvailabilityOut(BaseModel):
    """Availability for a calendar day in the salon's configured timezone."""

    timezone: str
    day: str
    open_windows: list[list[str]] = []
    slots: list[TimeSlot] = []


class BookingServiceOut(ORMModel):
    id: UUID
    booking_id: UUID
    service_id: UUID
    base_price: Decimal
    service_policy_snapshot_json: dict
    commission_rule_snapshot_json: dict


class BookingOut(ORMModel):
    id: UUID
    org_id: UUID
    client_id: UUID
    stylist_id: UUID | None = None
    starts_at: datetime
    ends_at: datetime
    status: str
    total_price: Decimal
    agreed_hold_amount: Decimal
    agreed_no_show_fee: Decimal
    agreed_late_cancel_fee: Decimal
    free_cancel_deadline_at: datetime
    policy_snapshot_json: dict
    commission_snapshot: dict
    cancellation_fee_json: dict | None = None
    cancellation_reason: str | None = None
    customer_notes: str | None = None
    created_at: datetime
    booking_services: list[BookingServiceOut] = []
    client_name: str | None = None
    client_picture: str | None = None
    client_email: str | None = None
    client_phone: str | None = None
    stylist_name: str | None = None
    stylist_picture: str | None = None
    service_name: str | None = None
    organization_name: str | None = None
    organization_timezone: str | None = None


def _user_display_name(user) -> str | None:
    if user is None:
        return None
    profile = getattr(user, "profile", None)
    if profile is not None:
        parts = [profile.first_name, profile.last_name]
        name = " ".join(p for p in parts if p).strip()
        if name:
            return name
    email = getattr(user, "email", None)
    return email or None


def _user_picture(user) -> str | None:
    if user is None:
        return None
    profile = getattr(user, "profile", None)
    if profile is None:
        return None
    return getattr(profile, "picture", None)


def booking_to_out(booking) -> BookingOut:
    """Serialize a Booking ORM row with eager-loaded relations into BookingOut."""
    client = getattr(booking, "client", None)
    stylist = getattr(booking, "stylist", None)
    services = getattr(booking, "booking_services", None) or []
    first_service = services[0] if services else None
    service_rel = getattr(first_service, "service", None) if first_service else None
    client_profile = getattr(client, "profile", None) if client else None
    organization = getattr(booking, "organization", None)
    org_settings = getattr(organization, "settings", None) if organization else None

    return BookingOut(
        id=booking.id,
        org_id=booking.org_id,
        client_id=booking.client_id,
        stylist_id=booking.stylist_id,
        starts_at=booking.starts_at,
        ends_at=booking.ends_at,
        status=booking.status.value if hasattr(booking.status, "value") else str(booking.status),
        total_price=booking.total_price,
        agreed_hold_amount=booking.agreed_hold_amount,
        agreed_no_show_fee=booking.agreed_no_show_fee,
        agreed_late_cancel_fee=booking.agreed_late_cancel_fee,
        free_cancel_deadline_at=booking.free_cancel_deadline_at,
        policy_snapshot_json=booking.policy_snapshot_json or {},
        commission_snapshot=booking.commission_snapshot or {},
        cancellation_fee_json=booking.cancellation_fee_json,
        cancellation_reason=booking.cancellation_reason,
        customer_notes=booking.customer_notes,
        created_at=booking.created_at,
        booking_services=[BookingServiceOut.model_validate(bs) for bs in services],
        client_name=_user_display_name(client),
        client_picture=_user_picture(client),
        client_email=getattr(client, "email", None) if client else None,
        client_phone=getattr(client_profile, "phone", None) if client_profile else None,
        stylist_name=_user_display_name(stylist),
        stylist_picture=_user_picture(stylist),
        service_name=getattr(service_rel, "name", None) if service_rel else None,
        organization_name=getattr(organization, "name", None) if organization else None,
        organization_timezone=getattr(org_settings, "timezone", None) if org_settings else None,
    )
