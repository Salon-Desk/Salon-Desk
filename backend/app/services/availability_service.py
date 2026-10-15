"""Timezone, working hours, shifts, and simultaneous capacity checks."""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.booking import Booking, BookingService
from app.models.enums import BookingStatus, ServiceStatus
from app.models.organization import OrgSettings
from app.models.service import Service
from app.schemas.booking import TimeSlot


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
