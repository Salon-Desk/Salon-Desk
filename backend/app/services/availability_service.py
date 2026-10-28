"""Timezone, working hours, shifts, and simultaneous capacity checks."""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.booking import Booking, BookingService
from app.models.enums import BookingStatus, ServiceStatus, UserRole, UserStatus
from app.models.organization import (
    OrgEmployeeShift,
    OrgEmployeeTimeOff,
    OrgSettings,
    OrgShift,
)
from app.models.service import OrgEmployeeCategory, Service
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


async def is_stylist_on_time_off(
    db: AsyncSession,
    stylist_id: UUID,
    day: date,
) -> bool:
    stmt = select(func.count(OrgEmployeeTimeOff.id)).where(
        OrgEmployeeTimeOff.user_id == stylist_id,
        OrgEmployeeTimeOff.start_date <= day,
        OrgEmployeeTimeOff.end_date >= day,
    )
    count = (await db.execute(stmt)).scalar_one()
    if not isinstance(count, (int, float, str, bytes)):
        return False
    return int(count) > 0


async def find_eligible_stylists_for_service(
    db: AsyncSession,
    *,
    org_id: UUID,
    service: Service,
    day: date,
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
) -> list[User]:
    # 1. Fetch active stylists/owners
    stmt = select(User).where(
        User.org_id == org_id,
        User.role.in_([UserRole.STYLIST, UserRole.ORG_OWNER]),
        User.status == UserStatus.ACTIVE,
    )
    stylists = list((await db.execute(stmt)).scalars().all())
    if not stylists:
        return []

    # 2. Check service category assignments
    cat_stmt = (
        select(OrgEmployeeCategory.user_id)
        .join(User, User.id == OrgEmployeeCategory.user_id)
        .where(User.org_id == org_id)
    )
    assigned_any = (await db.execute(cat_stmt)).scalars().all()
    if assigned_any:
        match_cat_stmt = select(OrgEmployeeCategory.user_id).where(
            OrgEmployeeCategory.user_id.in_([s.id for s in stylists]),
            OrgEmployeeCategory.service_category_id == service.service_category_id,
        )
        matching_ids = set((await db.execute(match_cat_stmt)).scalars().all())
        stylists = [s for s in stylists if s.id in matching_ids]
        if not stylists:
            return []

    # 3. Filter out stylists on time off
    time_off_stmt = select(OrgEmployeeTimeOff.user_id).where(
        OrgEmployeeTimeOff.user_id.in_([s.id for s in stylists]),
        OrgEmployeeTimeOff.start_date <= day,
        OrgEmployeeTimeOff.end_date >= day,
    )
    time_off_ids = set((await db.execute(time_off_stmt)).scalars().all())
    stylists = [s for s in stylists if s.id not in time_off_ids]
    if not stylists:
        return []

    # 4. Filter by weekly assigned shifts
    shifts_stmt = (
        select(OrgEmployeeShift, OrgShift)
        .join(OrgShift, OrgShift.id == OrgEmployeeShift.org_shift_id)
        .where(
            OrgEmployeeShift.user_id.in_([s.id for s in stylists]),
            OrgShift.org_id == org_id,
        )
    )
    shift_results = (await db.execute(shifts_stmt)).all()
    stylist_shifts: dict[UUID, list[tuple[OrgEmployeeShift, OrgShift]]] = {}
    for emp_shift, shift_template in shift_results:
        stylist_shifts.setdefault(emp_shift.user_id, []).append((emp_shift, shift_template))

    filtered_stylists: list[User] = []
    settings_res = None
    tz = None

    for s in stylists:
        assigned = stylist_shifts.get(s.id)
        if assigned:
            matching_shifts = [
                (es, st) for es, st in assigned if _day_matches_shift_days(day, es.days)
            ]
            if not matching_shifts:
                continue
            if starts_at and ends_at:
                if settings_res is None:
                    settings_res = await db.execute(
                        select(OrgSettings).where(OrgSettings.org_id == org_id)
                    )
                    settings = settings_res.scalar_one_or_none()
                    tz = resolve_org_timezone(settings.timezone if settings else "UTC")
                in_window = False
                for _, st in matching_shifts:
                    if isinstance(st.data, dict) and "windows" in st.data:
                        for w in st.data.get("windows", []):
                            if isinstance(w, (list, tuple)) and len(w) == 2:
                                sh, sm = map(int, str(w[0]).split(":"))
                                eh, em = map(int, str(w[1]).split(":"))
                                w_start = datetime(
                                    day.year, day.month, day.day, sh, sm, tzinfo=tz
                                ).astimezone(UTC)
                                w_end = datetime(
                                    day.year, day.month, day.day, eh, em, tzinfo=tz
                                ).astimezone(UTC)
                                if starts_at >= w_start and ends_at <= w_end:
                                    in_window = True
                                    break
                        if in_window:
                            break
                    else:
                        in_window = True
                if not in_window:
                    continue
        filtered_stylists.append(s)

    stylists = filtered_stylists
    if not stylists:
        return []

    # 5. Filter out stylists with overlapping bookings
    if starts_at and ends_at:
        busy_stmt = select(Booking.stylist_id).where(
            Booking.stylist_id.in_([s.id for s in stylists]),
            Booking.status.in_(
                [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED]
            ),
            Booking.starts_at < ends_at,
            Booking.ends_at > starts_at,
        )
        busy_ids = set((await db.execute(busy_stmt)).scalars().all())
        stylists = [s for s in stylists if s.id not in busy_ids]
        if not stylists:
            return []

    # 6. Rank stylists by workload on this date (least busy first)
    day_start = datetime(day.year, day.month, day.day, 0, 0, 0, tzinfo=UTC)
    day_end = day_start + timedelta(days=1)
    workload_stmt = (
        select(Booking.stylist_id, func.count(Booking.id))
        .where(
            Booking.stylist_id.in_([s.id for s in stylists]),
            Booking.status.in_(
                [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED]
            ),
            Booking.starts_at >= day_start,
            Booking.starts_at < day_end,
        )
        .group_by(Booking.stylist_id)
    )
    workload_map = dict((await db.execute(workload_stmt)).all())
    stylists.sort(key=lambda s: workload_map.get(s.id, 0))

    return stylists


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
    day = starts_local.date()
    day_key = _WEEKDAY_KEYS[day.weekday()]
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

    if await is_stylist_on_time_off(db, stylist_id, day):
        return False

    shift_stmt = (
        select(OrgShift, OrgEmployeeShift)
        .join(OrgEmployeeShift, OrgEmployeeShift.org_shift_id == OrgShift.id)
        .where(
            OrgEmployeeShift.user_id == stylist_id,
            OrgShift.org_id == org_id,
        )
    )
    shift_rows = (await db.execute(shift_stmt)).all()
    if shift_rows:
        matching_rows = [(s, es) for s, es in shift_rows if _day_matches_shift_days(day, es.days)]
        if not matching_rows:
            return False

        shift_windows: list[list[str]] = []
        stylist_breaks: list[list[str]] = []
        for s, _ in matching_rows:
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
        if any(slot_start_time_s < b[1] and slot_end_time_s > b[0] for b in stylist_breaks):
            return False

    return True


async def check_slot_available(
    db: AsyncSession,
    *,
    service: Service,
    starts_at: datetime,
    ends_at: datetime,
    stylist_id: UUID | None = None,
    exclude_booking_id: UUID | None = None,
) -> bool:
    day = starts_at.date()
    now = datetime.now(UTC)
    if starts_at <= now:
        return False

    if stylist_id:
        if await is_stylist_on_time_off(db, stylist_id, day):
            return False

        shift_stmt = select(OrgEmployeeShift).where(
            OrgEmployeeShift.user_id == stylist_id,
        )
        assigned_shifts = (await db.execute(shift_stmt)).scalars().all()
        if assigned_shifts and not any(
            _day_matches_shift_days(day, es.days) for es in assigned_shifts
        ):
            return False

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
    else:
        org_stylists_count_q = select(func.count(User.id)).where(
            User.org_id == service.organization_id,
            User.role.in_([UserRole.STYLIST, UserRole.ORG_OWNER]),
            User.status == UserStatus.ACTIVE,
        )
        org_has_stylists = (await db.execute(org_stylists_count_q)).scalar_one()
        if int(org_has_stylists) > 0:
            eligible = await find_eligible_stylists_for_service(
                db,
                org_id=service.organization_id,
                service=service,
                day=day,
                starts_at=starts_at,
                ends_at=ends_at,
            )
            if not eligible:
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

        if await is_stylist_on_time_off(db, stylist_id, day):
            return AvailabilityOut(
                timezone=str(tz),
                day=day.isoformat(),
                open_windows=[],
                slots=[],
                salon_hours=salon_open_windows,
                shift_windows=[],
                stylist_name=stylist_name,
                simultaneous_capacity=service.simultaneous_capacity,
                service_duration_minutes=duration_minutes or service.duration_minutes,
            )

        shift_stmt = (
            select(OrgShift, OrgEmployeeShift)
            .join(OrgEmployeeShift, OrgEmployeeShift.org_shift_id == OrgShift.id)
            .where(
                OrgEmployeeShift.user_id == stylist_id,
                OrgShift.org_id == service.organization_id,
            )
        )
        shift_rows = (await db.execute(shift_stmt)).all()
        if shift_rows:
            matching_rows = [
                (s, es) for s, es in shift_rows if _day_matches_shift_days(day, es.days)
            ]
            if not matching_rows:
                return AvailabilityOut(
                    timezone=str(tz),
                    day=day.isoformat(),
                    open_windows=[],
                    slots=[],
                    salon_hours=salon_open_windows,
                    shift_windows=[],
                    stylist_name=stylist_name,
                    simultaneous_capacity=service.simultaneous_capacity,
                    service_duration_minutes=duration_minutes or service.duration_minutes,
                )
            for s, _ in matching_rows:
                if isinstance(s.data, dict):
                    if "windows" in s.data:
                        for w in s.data.get("windows", []):
                            if isinstance(w, (list, tuple)) and len(w) == 2:
                                shift_windows.append([str(w[0]), str(w[1])])
                    if "breaks" in s.data:
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
