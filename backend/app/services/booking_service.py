from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, func, select
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
from app.models.organization import Organization, OrgCancellationPolicy, OrgSettings
from app.models.platform import PlatformCommission
from app.models.service import Service
from app.schemas.booking import TimeSlot
from app.services.payment_service import void_hold
from app.services.policy_engine import can_self_cancel


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


async def check_slot_available(
    db: AsyncSession,
    *,
    service: Service,
    starts_at: datetime,
    ends_at: datetime,
    exclude_booking_id: UUID | None = None,
) -> bool:
    conditions = [
        Booking.org_id == service.organization_id,
        Booking.status.in_(
            [
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.COMPLETED,
            ]
        ),
        Booking.starts_at < ends_at,
        Booking.ends_at > starts_at,
    ]
    if exclude_booking_id:
        conditions.append(Booking.id != exclude_booking_id)

    # Count overlapping bookings that include this service
    overlap_q = (
        select(func.count(Booking.id))
        .select_from(Booking)
        .join(BookingService, BookingService.booking_id == Booking.id)
        .where(and_(*conditions, BookingService.service_id == service.id))
    )
    count = (await db.execute(overlap_q)).scalar_one()
    return int(count) < service.simultaneous_capacity


async def get_availability(
    db: AsyncSession,
    *,
    service_id: UUID,
    day: date,
    slot_minutes: int = 30,
) -> list[TimeSlot]:
    service = await db.get(Service, service_id)
    if service is None or service.status != ServiceStatus.ACTIVE:
        raise NotFoundError("Service not found")

    settings_result = await db.execute(
        select(OrgSettings).where(OrgSettings.org_id == service.organization_id)
    )
    settings = settings_result.scalar_one_or_none()
    weekday_keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    day_key = weekday_keys[day.weekday()]
    windows = (settings.working_hours if settings else {}).get(day_key, [])
    if not windows:
        return []

    slots: list[TimeSlot] = []
    duration = timedelta(minutes=service.duration_minutes)
    step = timedelta(minutes=slot_minutes)

    for window in windows:
        if not isinstance(window, (list, tuple)) or len(window) != 2:
            continue
        start_h, start_m = map(int, window[0].split(":"))
        end_h, end_m = map(int, window[1].split(":"))
        cursor = datetime(day.year, day.month, day.day, start_h, start_m, tzinfo=UTC)
        window_end = datetime(day.year, day.month, day.day, end_h, end_m, tzinfo=UTC)
        while cursor + duration <= window_end:
            slot_end = cursor + duration
            ok = await check_slot_available(db, service=service, starts_at=cursor, ends_at=slot_end)
            slots.append(TimeSlot(starts_at=cursor, ends_at=slot_end, available=ok))
            cursor += step
    return slots


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
