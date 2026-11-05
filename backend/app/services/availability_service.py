"""Timezone, working hours, shifts, and simultaneous capacity checks."""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.booking import Booking, BookingService
from app.models.enums import BookingStatus, ServiceStatus, UserRole
from app.models.organization import OrgEmployeeShift, OrgSettings, OrgShift
from app.models.service import Service
from app.models.user import User
from app.schemas.booking import AvailabilityOut, TimeSlot

_WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


_WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def _day_matches_shift_days(day: date, shift_days: list[str] | None) -> bool:
    if shift_days is None:
        shift_days = ["monday", "tuesday", "wednesday", "thursday", "friday"]
    if not shift_days:
        return False
    weekday_name = day.strftime("%A").lower()
    weekday_abbr = _WEEKDAY_KEYS[day.weekday()]
    return any(
        d.lower().strip() == weekday_name or d.lower().strip().startswith(weekday_abbr)
        for d in shift_days
    )


def resolve_org_timezone(name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo((name or "UTC").strip() or "UTC")
    except Exception:  # noqa: BLE001 — invalid IANA id
        return ZoneInfo("UTC")


def _intersect_windows(
    salon_windows: list[list[str]], stylist_windows: list[list[str]]
) -> list[list[str]]:
    """Intersect salon open windows with stylist shift windows."""
    result: list[list[str]] = []
    for sw_start, sw_end in salon_windows:
        for tw_start, tw_end in stylist_windows:
            start = max(sw_start, tw_start)
            end = min(sw_end, tw_end)
            if start < end:
                result.append([start, end])
    sorted_unique: list[list[str]] = []
    for r in sorted(result, key=lambda x: x[0]):
        if not sorted_unique or sorted_unique[-1] != r:
            sorted_unique.append(r)
    return sorted_unique


async def check_stylist_shift(
    db: AsyncSession,
    *,
    org_id: UUID,
    stylist_id: UUID,
    starts_at: datetime,
    ends_at: datetime,
) -> bool:
    """Verify if a stylist is scheduled on shift and not on break for the given slot."""
    settings_result = await db.execute(select(OrgSettings).where(OrgSettings.org_id == org_id))
    settings = settings_result.scalar_one_or_none()
    tz_name = settings.timezone if settings and settings.timezone else "UTC"
    tz = resolve_org_timezone(tz_name)

    starts_local = starts_at.astimezone(tz)
    ends_local = ends_at.astimezone(tz)
    day_key = _WEEKDAY_KEYS[starts_local.date().weekday()]
    windows_raw = (settings.working_hours if settings else {}).get(day_key, [])
    salon_open_windows: list[list[str]] = []
    for window in windows_raw or []:
        if isinstance(window, (list, tuple)) and len(window) == 2:
            salon_open_windows.append([str(window[0]), str(window[1])])

    slot_start_time_s = starts_local.strftime("%H:%M")
    slot_end_time_s = ends_local.strftime("%H:%M")

    # If salon working hours are configured, slot must fall within them
    if salon_open_windows and not any(
        slot_start_time_s >= w[0] and slot_end_time_s <= w[1] for w in salon_open_windows
    ):
        return False

    shift_stmt = (
        select(OrgShift)
        .join(OrgEmployeeShift, OrgEmployeeShift.org_shift_id == OrgShift.id)
        .where(
            OrgEmployeeShift.user_id == stylist_id,
            OrgShift.org_id == org_id,
        )
    )
    shifts = (await db.execute(shift_stmt)).scalars().all()
    shift_windows: list[list[str]] = []
    stylist_breaks: list[list[str]] = []
    for s in shifts:
        if isinstance(s.data, dict):
            for w in s.data.get("windows", []):
                if isinstance(w, (list, tuple)) and len(w) == 2:
                    shift_windows.append([str(w[0]), str(w[1])])
            for b in s.data.get("breaks", []):
                if isinstance(b, (list, tuple)) and len(b) == 2:
                    stylist_breaks.append([str(b[0]), str(b[1])])

    # If stylist has designated shift windows, slot must fall within them
    if shift_windows and not any(
        slot_start_time_s >= w[0] and slot_end_time_s <= w[1] for w in shift_windows
    ):
        return False

    # Slot must not conflict with stylist breaks
    return not any(slot_start_time_s < b[1] and slot_end_time_s > b[0] for b in stylist_breaks)


async def check_slot_available(
    db: AsyncSession,
    *,
    service: Service,
    starts_at: datetime,
    ends_at: datetime,
    stylist_id: UUID | None = None,
    exclude_booking_id: UUID | None = None,
) -> bool:
    now = datetime.now(UTC)
    if starts_at <= now:
        return False
    if stylist_id:
        stylist_conditions = [
            Booking.stylist_id == stylist_id,
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
            stylist_conditions.append(Booking.id != exclude_booking_id)
        stylist_count_q = select(func.count(Booking.id)).where(and_(*stylist_conditions))
        stylist_busy = (await db.execute(stylist_count_q)).scalar_one()
        if int(stylist_busy) > 0:
            return False

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
    stylist_id: UUID | None = None,
    duration_minutes: int | None = None,
) -> AvailabilityOut:
    """
    Build slots from org working_hours, stylist shifts, service duration, and simultaneous capacity
    for the given calendar day.
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
    salon_open_windows: list[list[str]] = []
    for window in windows_raw or []:
        if isinstance(window, (list, tuple)) and len(window) == 2:
            salon_open_windows.append([str(window[0]), str(window[1])])

    # If the salon is closed this day, no appointment can be held
    if not salon_open_windows:
        return AvailabilityOut(
            timezone=str(tz),
            day=day.isoformat(),
            open_windows=[],
            slots=[],
            salon_hours=[],
            shift_windows=[],
            stylist_name=None,
            simultaneous_capacity=service.simultaneous_capacity,
            service_duration_minutes=duration_minutes or service.duration_minutes,
        )

    stylist_name: str | None = None
    stylist_breaks: list[list[str]] = []
    shift_windows: list[list[str]] = []
    effective_open_windows: list[list[str]] = salon_open_windows

    if stylist_id:
        stylist_stmt = select(User).options(selectinload(User.profile)).where(User.id == stylist_id)
        stylist_user = (await db.execute(stylist_stmt)).scalar_one_or_none()
        if stylist_user:
            if stylist_user.profile and getattr(stylist_user.profile, "full_name", None):
                stylist_name = stylist_user.profile.full_name
            else:
                stylist_name = stylist_user.email

        shift_stmt = (
            select(OrgShift)
            .join(OrgEmployeeShift, OrgEmployeeShift.org_shift_id == OrgShift.id)
            .where(
                OrgEmployeeShift.user_id == stylist_id,
                OrgShift.org_id == service.organization_id,
            )
        )
        shifts = (await db.execute(shift_stmt)).scalars().all()
        for s in shifts:
            if isinstance(s.data, dict):
                for w in s.data.get("windows", []):
                    if isinstance(w, (list, tuple)) and len(w) == 2:
                        shift_windows.append([str(w[0]), str(w[1])])
                for b in s.data.get("breaks", []):
                    if isinstance(b, (list, tuple)) and len(b) == 2:
                        stylist_breaks.append([str(b[0]), str(b[1])])

        if shift_windows:
            effective_open_windows = _intersect_windows(salon_open_windows, shift_windows)
        else:
            shift_windows = salon_open_windows
    else:
        stylist_name = "Any available stylist"
        shifts_stmt = select(OrgShift).where(OrgShift.org_id == service.organization_id)
        all_shifts = (await db.execute(shifts_stmt)).scalars().all()
        for s in all_shifts:
            if isinstance(s.data, dict):
                for w in s.data.get("windows", []):
                    if isinstance(w, (list, tuple)) and len(w) == 2:
                        shift_windows.append([str(w[0]), str(w[1])])
        if not shift_windows:
            shift_windows = salon_open_windows

    if not effective_open_windows:
        return AvailabilityOut(
            timezone=str(tz),
            day=day.isoformat(),
            open_windows=[],
            slots=[],
            salon_hours=salon_open_windows,
            shift_windows=shift_windows,
            stylist_name=stylist_name,
            simultaneous_capacity=service.simultaneous_capacity,
            service_duration_minutes=duration_minutes or service.duration_minutes,
        )

    slots: list[TimeSlot] = []
    effective_duration_minutes = (
        duration_minutes
        if (duration_minutes and duration_minutes > 0)
        else service.duration_minutes
    )
    duration = timedelta(minutes=effective_duration_minutes)
    step = timedelta(minutes=slot_minutes)
    now_utc = datetime.now(UTC)

    org_stylists: list[User] = []
    if stylist_id is None:
        stylists_q = select(User).where(
            User.org_id == service.organization_id,
            User.role.in_([UserRole.STYLIST, UserRole.ORG_OWNER]),
        )
        org_stylists = list((await db.execute(stylists_q)).scalars().all())

    for start_s, end_s in effective_open_windows:
        start_h, start_m = map(int, start_s.split(":"))
        end_h, end_m = map(int, end_s.split(":"))
        cursor_local = datetime(day.year, day.month, day.day, start_h, start_m, tzinfo=tz)
        window_end_local = datetime(day.year, day.month, day.day, end_h, end_m, tzinfo=tz)
        cursor = cursor_local.astimezone(UTC)
        window_end = window_end_local.astimezone(UTC)

        while cursor + duration <= window_end:
            slot_end = cursor + duration
            slot_end_local = cursor_local + duration

            if slot_end <= now_utc:
                cursor += step
                cursor_local += step
                continue

            slot_start_time_s = cursor_local.strftime("%H:%M")
            slot_end_time_s = slot_end_local.strftime("%H:%M")
            is_break_conflict = any(
                slot_start_time_s < b[1] and slot_end_time_s > b[0] for b in stylist_breaks
            )

            if is_break_conflict:
                slots.append(TimeSlot(starts_at=cursor, ends_at=slot_end, available=False))
                cursor += step
                cursor_local += step
                continue

            ok = await check_slot_available(
                db,
                service=service,
                starts_at=cursor,
                ends_at=slot_end,
                stylist_id=stylist_id,
            )

            if ok and stylist_id is None and org_stylists:
                booked_stylists_q = select(func.count(func.distinct(Booking.stylist_id))).where(
                    Booking.org_id == service.organization_id,
                    Booking.stylist_id.in_([u.id for u in org_stylists]),
                    Booking.status.in_(
                        [
                            BookingStatus.PENDING,
                            BookingStatus.CONFIRMED,
                            BookingStatus.COMPLETED,
                        ]
                    ),
                    Booking.starts_at < slot_end,
                    Booking.ends_at > cursor,
                )
                busy_stylists = (await db.execute(booked_stylists_q)).scalar_one()
                if int(busy_stylists) >= len(org_stylists):
                    ok = False

            slots.append(TimeSlot(starts_at=cursor, ends_at=slot_end, available=ok))
            cursor += step
            cursor_local += step

    return AvailabilityOut(
        timezone=str(tz),
        day=day.isoformat(),
        open_windows=effective_open_windows,
        slots=slots,
        salon_hours=salon_open_windows,
        shift_windows=shift_windows,
        stylist_name=stylist_name,
        simultaneous_capacity=service.simultaneous_capacity,
        service_duration_minutes=effective_duration_minutes,
    )
