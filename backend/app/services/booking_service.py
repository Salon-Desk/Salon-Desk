from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.booking import Booking, BookingService
from app.models.enums import (
    BookingStatus,
    OrganizationStatus,
    OrgCancellationPolicyStatus,
    ServiceStatus,
)
from app.models.ledger import PlatformCommission
from app.models.organization import Organization
from app.models.policy import OrgCancellationPolicy
from app.models.service import Service
from app.services.availability_service import check_slot_available, get_availability
from app.services.payment_service import void_hold
from app.services.policy_engine import can_self_cancel

__all__ = [
    "create_booking",
    "get_booking",
    "list_client_bookings",
    "list_org_bookings",
    "check_slot_available",
    "get_availability",
    "cancel_booking",
]


async def _commission_snapshot(db: AsyncSession, service: Service, price: Decimal) -> dict:
    result = await db.execute(
        select(PlatformCommission)
        .where(PlatformCommission.service_category_id == service.service_category_id)
        .order_by(PlatformCommission.created_at.desc())
        .limit(1)
    )
    commission = result.scalar_one_or_none()
    if commission is None:
        return {"type": "percentage", "percentage": "0", "amount": "0"}

    amount = Decimal("0")
    if commission.percentage is not None:
        amount += (price * commission.percentage / Decimal("100")).quantize(Decimal("0.01"))
    if commission.flat is not None:
        amount += commission.flat
    return {
        "type": commission.type.value,
        "percentage": str(commission.percentage) if commission.percentage else None,
        "flat": str(commission.flat) if commission.flat else None,
        "amount": str(amount),
        "commission_id": str(commission.id),
    }


async def create_booking(
    db: AsyncSession,
    *,
    client_id: UUID,
    org_id: UUID,
    service_ids: list[UUID],
    starts_at: datetime,
    stylist_id: UUID | None,
    customer_notes: str | None,
) -> Booking:
    org = await db.get(Organization, org_id)
    if org is None or org.status != OrganizationStatus.APPROVED:
        raise ForbiddenError("Organization is not available for booking")

    result = await db.execute(
        select(Service).where(
            Service.id.in_(service_ids),
            Service.organization_id == org_id,
            Service.status == ServiceStatus.ACTIVE,
        )
    )
    services = list(result.scalars().all())
    if len(services) != len(set(service_ids)):
        raise NotFoundError("One or more services not found")

    total_duration = sum(s.duration_minutes for s in services)
    ends_at = starts_at + timedelta(minutes=total_duration)
    total_price = sum((s.base_price for s in services), Decimal("0"))

    # Use first service for capacity check and commission snapshot primary
    primary = services[0]
    available = await check_slot_available(
        db,
        service=primary,
        starts_at=starts_at,
        ends_at=ends_at,
    )
    if not available:
        raise ForbiddenError("Selected time slot is not available")

    commission = await _commission_snapshot(db, primary, total_price)
    booking = Booking(
        org_id=org_id,
        client_id=client_id,
        stylist_id=stylist_id,
        starts_at=starts_at,
        ends_at=ends_at,
        status=BookingStatus.PENDING,
        total_price=total_price,
        commission_snapshot=commission,
        customer_notes=customer_notes,
    )
    db.add(booking)
    await db.flush()

    for service in services:
        db.add(
            BookingService(
                booking_id=booking.id,
                service_id=service.id,
                base_price=service.base_price,
            )
        )
    await db.flush()
    return await get_booking(db, booking.id)


async def get_booking(db: AsyncSession, booking_id: UUID) -> Booking:
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.booking_services))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        raise NotFoundError("Booking not found")
    return booking


async def list_client_bookings(db: AsyncSession, client_id: UUID) -> list[Booking]:
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.booking_services))
        .where(Booking.client_id == client_id)
        .order_by(Booking.starts_at.desc())
    )
    return list(result.scalars().all())


async def list_org_bookings(
    db: AsyncSession,
    org_id: UUID,
    *,
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
) -> list[Booking]:
    stmt = (
        select(Booking)
        .options(selectinload(Booking.booking_services))
        .where(Booking.org_id == org_id)
    )
    if starts_at is not None:
        stmt = stmt.where(Booking.starts_at >= starts_at)
    if ends_at is not None:
        stmt = stmt.where(Booking.starts_at <= ends_at)
    stmt = stmt.order_by(Booking.starts_at.asc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def cancel_booking(
    db: AsyncSession,
    *,
    booking: Booking,
    reason: str | None,
    actor_id: UUID,
    is_org: bool = False,
) -> Booking:
    if booking.status in {BookingStatus.CANCELLED, BookingStatus.COMPLETED}:
        raise ForbiddenError("Booking cannot be cancelled")

    if not is_org and booking.client_id != actor_id:
        raise ForbiddenError("Not your booking")

    policy_result = await db.execute(
        select(OrgCancellationPolicy).where(
            OrgCancellationPolicy.org_id == booking.org_id,
            OrgCancellationPolicy.status == OrgCancellationPolicyStatus.ACTIVE,
        )
    )
    policy = policy_result.scalar_one_or_none()
    policy_data = policy.data if policy else {"free_cancel_hours": 24}

    now = datetime.now(UTC)
    starts = booking.starts_at
    if starts.tzinfo is None:
        starts = starts.replace(tzinfo=UTC)
    hours_until = (starts - now).total_seconds() / 3600
    free_hours = float(policy_data.get("free_cancel_hours", 24))
    free = can_self_cancel(hours_until_start=hours_until, free_cancel_hours=free_hours)

    fee_json = None
    if free or is_org:
        await void_hold(db, booking=booking)
        fee_json = {"fee": "0", "reason": "free_cancel" if free else "org_cancel"}
    else:
        pct = Decimal(str(policy_data.get("late_cancel_fee_percent", 25)))
        fee = (booking.total_price * pct / Decimal("100")).quantize(Decimal("0.01"))
        fee_json = {
            "fee": str(fee),
            "percent": str(pct),
            "reason": "late_cancel",
        }

    booking.status = BookingStatus.CANCELLED
    booking.cancellation_reason = reason
    booking.cancellation_fee_json = fee_json
    await db.flush()
    return booking
