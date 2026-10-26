"""Timezone, working hours, shifts, and simultaneous capacity checks."""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.booking import Booking, BookingService
from app.models.enums import BookingStatus, ServiceStatus
from app.models.organization import OrgSettings
from app.models.service import Service
from app.schemas.booking import AvailabilityOut, TimeSlot

_WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def resolve_org_timezone(name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo((name or "UTC").strip() or "UTC")
    except Exception:  # noqa: BLE001 — invalid IANA id
        return ZoneInfo("UTC")


async def check_slot_available(
    db: AsyncSession,
    *,
    service: Service,
    starts_at: datetime,
    ends_at: datetime,
    exclude_booking_id: UUID | None = None,
) -> bool:
    now = datetime.now(UTC)
    conditions = [
        Booking.org_id == service.organization_id,
        or_(
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
            and_(
                Booking.status.in_([BookingStatus.PENDING, BookingStatus.PENDING_PAYMENT]),
                Booking.created_at >= now - timedelta(minutes=15),
            ),
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
) -> AvailabilityOut:
    """
    Build slots from org working_hours for the given calendar day.

    Working-hour windows are interpreted in the organization timezone and returned
    as UTC-aware datetimes (ISO) for booking.create.
    """
    service = await db.get(Service, service_id)
    if service is None or service.status != ServiceStatus.ACTIVE:
        raise NotFoundError("Service not found")

    settings_result = await db.execute(
        select(OrgSettings).where(OrgSettings.org_id == service.organization_id)
    )
    settings = settings_result.scalar_one_or_none()
    tz_name = settings.timezone if settings and settings.timezone else "UTC"
    tz = resolve_org_timezone(tz_name)

    day_key = _WEEKDAY_KEYS[day.weekday()]
    windows_raw = (settings.working_hours if settings else {}).get(day_key, [])
    open_windows: list[list[str]] = []
    for window in windows_raw or []:
        if isinstance(window, (list, tuple)) and len(window) == 2:
            open_windows.append([str(window[0]), str(window[1])])

    if not open_windows:
        return AvailabilityOut(
            timezone=str(tz),
            day=day.isoformat(),
            open_windows=[],
            slots=[],
        )

    slots: list[TimeSlot] = []
    duration = timedelta(minutes=service.duration_minutes)
    step = timedelta(minutes=slot_minutes)
    now_utc = datetime.now(UTC)

    for start_s, end_s in open_windows:
        start_h, start_m = map(int, start_s.split(":"))
        end_h, end_m = map(int, end_s.split(":"))
        # Local wall clock in salon TZ → UTC for persistence / overlap checks
        cursor_local = datetime(day.year, day.month, day.day, start_h, start_m, tzinfo=tz)
        window_end_local = datetime(day.year, day.month, day.day, end_h, end_m, tzinfo=tz)
        cursor = cursor_local.astimezone(UTC)
        window_end = window_end_local.astimezone(UTC)

        while cursor + duration <= window_end:
            slot_end = cursor + duration
            if slot_end <= now_utc:
                cursor += step
                continue
            ok = await check_slot_available(db, service=service, starts_at=cursor, ends_at=slot_end)
            slots.append(TimeSlot(starts_at=cursor, ends_at=slot_end, available=ok))
            cursor += step

    return AvailabilityOut(
        timezone=str(tz),
        day=day.isoformat(),
        open_windows=open_windows,
        slots=slots,
    )
