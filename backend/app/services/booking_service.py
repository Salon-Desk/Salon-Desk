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
    PaymentCaptureType,
    PaymentHoldStatus,
    ServiceStatus,
    UserRole,
    UserStatus,
)
from app.models.organization import Organization
from app.models.payment import PaymentHold
from app.models.policy import OrgCancellationPolicy
from app.models.service import Service
from app.models.user import User
from app.services.availability_service import check_slot_available, get_availability
from app.services.commission_service import (
    commission_rule_for_service,
    total_platform_commission_for_services,
)
from app.services.ledger_service import append_ledger
from app.services.payment_service import capture_hold, void_hold
from app.services.policy_engine import (
    agreed_late_cancel_fee,
    agreed_no_show_fee,
    free_cancel_deadline_at,
    is_within_free_cancel_window,
)

__all__ = [
    "create_booking",
    "get_booking",
    "list_client_bookings",
    "list_org_bookings",
    "check_slot_available",
    "get_availability",
    "cancel_booking",
    "reschedule_booking",
]

_BOOKING_LOAD_OPTIONS = (
    selectinload(Booking.organization).selectinload(Organization.settings),
    selectinload(Booking.client).selectinload(User.profile),
    selectinload(Booking.stylist).selectinload(User.profile),
    selectinload(Booking.booking_services).selectinload(BookingService.service),
    selectinload(Booking.payment_holds),
    selectinload(Booking.consents),
)

_DEFAULT_POLICY = {
    "free_cancel_hours": 24,
    "no_show_fee_percent": 50,
    "late_cancel_fee_percent": 25,
}


async def _load_active_policy(db: AsyncSession, org_id: UUID) -> dict:
    result = await db.execute(
        select(OrgCancellationPolicy).where(
            OrgCancellationPolicy.org_id == org_id,
            OrgCancellationPolicy.status == OrgCancellationPolicyStatus.ACTIVE,
        )
    )
    policy = result.scalar_one_or_none()
    if policy is None:
        return dict(_DEFAULT_POLICY)
    return {
        "policy_id": str(policy.id),
        "name": policy.name,
        **(policy.data or {}),
    }


def _get_user_display_name(user: User | None) -> str:
    if not user:
        return "Assigned stylist"
    if hasattr(user, "profile") and user.profile:
        name = getattr(user.profile, "full_name", None)
        if callable(name):
            name = name()
        if name:
            return str(name)
    return getattr(user, "email", "Assigned stylist")


async def create_booking(
    db: AsyncSession,
    *,
    client_id: UUID,
    org_id: UUID,
    service_ids: list[UUID],
    starts_at: datetime,
    stylist_id: UUID | None,
    customer_notes: str | None,
    party_size: int = 1,
    service_stylists: list | None = None,
) -> Booking:
    org = await db.get(Organization, org_id)
    if org is None or org.status != OrganizationStatus.APPROVED:
        raise ForbiddenError("Organization is not available for booking")

    now_utc = datetime.now(UTC)
    if starts_at <= now_utc:
        raise ForbiddenError("Cannot book an appointment in the past")

    if not service_ids:
        raise ForbiddenError("At least one service must be selected")

    party_size = max(1, min(10, party_size))

    result = await db.execute(
        select(Service).where(
            Service.id.in_(service_ids),
            Service.organization_id == org_id,
            Service.status == ServiceStatus.ACTIVE,
        )
    )
    services = list(result.scalars().all())
    if len(services) != len(set(service_ids)):
        raise NotFoundError("One or more services not found or inactive")

    # Map per-service stylist selections
    service_stylist_map: dict[UUID, UUID | None] = {}
    if service_stylists:
        for ss in service_stylists:
            sid = getattr(ss, "service_id", None) or (
                ss.get("service_id") if isinstance(ss, dict) else None
            )
            stid = (
                getattr(ss, "stylist_id", None)
                if hasattr(ss, "stylist_id")
                else (ss.get("stylist_id") if isinstance(ss, dict) else None)
            )
            if sid:
                service_stylist_map[UUID(str(sid))] = UUID(str(stid)) if stid else None

    # Collect and validate all unique stylists
    all_stylist_ids: set[UUID] = set()
    if stylist_id is not None:
        all_stylist_ids.add(stylist_id)
    for stid in service_stylist_map.values():
        if stid is not None:
            all_stylist_ids.add(stid)

    stylist_users: dict[UUID, User] = {}
    for stid in all_stylist_ids:
        st = await db.get(User, stid)
        if st is None or st.org_id != org_id or st.status != UserStatus.ACTIVE:
            raise ForbiddenError("Selected stylist is not available at this salon")
        if st.role != UserRole.STYLIST:
            raise ForbiddenError("Selected staff member is not an active stylist")
        stylist_users[stid] = st

    # Fallback overall stylist_id to first service's stylist if not provided
    if stylist_id is None and services:
        stylist_id = service_stylist_map.get(services[0].id)

    total_duration = sum(s.duration_minutes for s in services)
    ends_at = starts_at + timedelta(minutes=total_duration)
    total_price = sum((s.base_price for s in services), Decimal("0")) * party_size

    # Supersede any previous incomplete pending bookings for this client on the same slot
    stale_user_pending_q = select(Booking).where(
        Booking.client_id == client_id,
        Booking.org_id == org_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.PENDING_PAYMENT]),
        Booking.starts_at < ends_at,
        Booking.ends_at > starts_at,
    )
    stale_user_pending = (await db.execute(stale_user_pending_q)).scalars().all()
    for stale in stale_user_pending:
        stale.status = BookingStatus.CANCELLED
        stale.cancellation_reason = "Superseded by new booking attempt"
        stale_holds = (
            (
                await db.execute(
                    select(PaymentHold).where(
                        PaymentHold.booking_id == stale.id,
                        PaymentHold.status == PaymentHoldStatus.PENDING,
                    )
                )
            )
            .scalars()
            .all()
        )
        for h in stale_holds:
            h.status = PaymentHoldStatus.VOIDED
    if stale_user_pending:
        await db.flush()

    # Verify slot availability: either segmented per service if specific stylists differ, or across the full session
    has_varying_stylists = bool(service_stylist_map and len(set(service_stylist_map.values())) > 1)
    if has_varying_stylists:
        curr_start = starts_at
        for s in services:
            curr_end = curr_start + timedelta(minutes=s.duration_minutes)
            s_stylist = service_stylist_map.get(s.id, stylist_id)
            slot_ok = await check_slot_available(
                db,
                service=s,
                starts_at=curr_start,
                ends_at=curr_end,
                stylist_id=s_stylist,
            )
            if not slot_ok:
                raise ForbiddenError(f"Selected time slot is not available for {s.name}")
            curr_start = curr_end
    else:
        primary = services[0]
        common_stylist = service_stylist_map.get(primary.id, stylist_id)
        available = await check_slot_available(
            db,
            service=primary,
            starts_at=starts_at,
            ends_at=ends_at,
            stylist_id=common_stylist,
        )
        if not available:
            raise ForbiddenError("Selected time slot is not available")

    policy_snapshot = await _load_active_policy(db, org_id)
    policy_snapshot["party_size"] = party_size
    no_show_fee = agreed_no_show_fee(total_price=total_price, policy_data=policy_snapshot)
    late_cancel_fee = agreed_late_cancel_fee(total_price=total_price, policy_data=policy_snapshot)
    deadline = free_cancel_deadline_at(starts_at=starts_at, policy_data=policy_snapshot)

    platform_commission = (await total_platform_commission_for_services(db, services)) * party_size
    primary = services[0]
    primary_rule = await commission_rule_for_service(db, primary)
    commission_snapshot = {
        **primary_rule,
        "amount": str(platform_commission),
    }
    agreed_hold = (total_price + platform_commission).quantize(Decimal("0.01"))

    # Format notes
    note_segments: list[str] = []
    if party_size > 1:
        note_segments.append(f"Party size: {party_size} guests")
    if customer_notes:
        note_segments.append(customer_notes)
    if service_stylist_map:
        stylist_details = []
        for s in services:
            st_id = service_stylist_map.get(s.id)
            st_user = stylist_users.get(st_id) if st_id else None
            st_name = (
                _get_user_display_name(st_user)
                if st_user
                else ("Any available stylist" if not st_id else "Assigned stylist")
            )
            stylist_details.append(f"{s.name}: {st_name}")
        note_segments.append("Stylists: " + " · ".join(stylist_details))

    final_notes = "\n".join(note_segments) if note_segments else None

    booking = Booking(
        org_id=org_id,
        client_id=client_id,
        stylist_id=stylist_id,
        starts_at=starts_at,
        ends_at=ends_at,
        status=BookingStatus.PENDING_PAYMENT,
        total_price=total_price,
        agreed_hold_amount=agreed_hold,
        agreed_no_show_fee=no_show_fee,
        agreed_late_cancel_fee=late_cancel_fee,
        free_cancel_deadline_at=deadline,
        policy_snapshot_json=policy_snapshot,
        commission_snapshot=commission_snapshot,
        customer_notes=final_notes,
    )
    db.add(booking)
    await db.flush()

    for service in services:
        line_rule = await commission_rule_for_service(db, service)
        svc_stylist_id = service_stylist_map.get(service.id, stylist_id)
        svc_policy = dict(policy_snapshot)
        if svc_stylist_id and svc_stylist_id in stylist_users:
            st_user = stylist_users[svc_stylist_id]
            svc_policy["stylist_id"] = str(svc_stylist_id)
            svc_policy["stylist_name"] = _get_user_display_name(st_user)
        db.add(
            BookingService(
                booking_id=booking.id,
                service_id=service.id,
                base_price=service.base_price,
                service_policy_snapshot_json=svc_policy,
                commission_rule_snapshot_json=line_rule,
            )
        )
    await db.flush()
    return await get_booking(db, booking.id)


async def get_booking(db: AsyncSession, booking_id: UUID) -> Booking:
    result = await db.execute(
        select(Booking).options(*_BOOKING_LOAD_OPTIONS).where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        raise NotFoundError("Booking not found")
    return booking


async def list_client_bookings(
    db: AsyncSession,
    client_id: UUID,
    sort: str = "starts_at_desc",
) -> list[Booking]:
    stmt = select(Booking).options(*_BOOKING_LOAD_OPTIONS).where(Booking.client_id == client_id)

    # Apply sorting at database level for better performance
    if sort == "starts_at_asc":
        stmt = stmt.order_by(Booking.starts_at.asc())
    elif sort == "starts_at_desc":
        stmt = stmt.order_by(Booking.starts_at.desc())
    elif sort == "created_at_asc":
        stmt = stmt.order_by(Booking.created_at.asc())
    elif sort == "created_at_desc":
        stmt = stmt.order_by(Booking.created_at.desc())
    elif sort == "total_price_asc":
        stmt = stmt.order_by(Booking.total_price.asc())
    elif sort == "total_price_desc":
        stmt = stmt.order_by(Booking.total_price.desc())
    else:
        # Default: starts_at_desc
        stmt = stmt.order_by(Booking.starts_at.desc())

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_org_bookings(
    db: AsyncSession,
    org_id: UUID,
    *,
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
) -> list[Booking]:
    stmt = select(Booking).options(*_BOOKING_LOAD_OPTIONS).where(Booking.org_id == org_id)
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

    free = is_within_free_cancel_window(
        free_cancel_deadline_at=booking.free_cancel_deadline_at,
    )

    fee_json = None
    if free or is_org:
        await void_hold(db, booking=booking)
        fee_json = {"fee": "0", "reason": "free_cancel" if free else "org_cancel"}
    else:
        fee = booking.agreed_late_cancel_fee
        await capture_hold(
            db,
            booking=booking,
            capture_type=PaymentCaptureType.LATE_CANCEL,
            amount=fee,
            final_capture=True,
        )
        fee_json = {
            "fee": str(fee),
            "reason": "late_cancel",
            "bounded_by": "agreed_late_cancel_fee",
        }

    booking.status = BookingStatus.CANCELLED
    booking.cancellation_reason = reason
    booking.cancellation_fee_json = fee_json
    await db.flush()
    return booking


async def reschedule_booking(
    db: AsyncSession,
    *,
    booking: Booking,
    starts_at: datetime,
    stylist_id: UUID | None = None,
    actor_id: UUID,
    is_org: bool = False,
) -> Booking:
    if booking.status in {
        BookingStatus.CANCELLED,
        BookingStatus.COMPLETED,
        BookingStatus.NO_SHOW,
    }:
        raise ForbiddenError(f"Booking in status {booking.status} cannot be rescheduled")

    if not is_org and booking.client_id != actor_id:
        raise ForbiddenError("Not your booking")

    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=UTC)

    if starts_at <= datetime.now(UTC):
        raise ForbiddenError("Cannot reschedule to a past time")

    original_duration = booking.ends_at - booking.starts_at
    ends_at = starts_at + original_duration

    target_stylist_id = stylist_id if stylist_id is not None else booking.stylist_id

    # Verify availability for all services in this booking
    for bs in booking.booking_services:
        service = await db.get(Service, bs.service_id)
        if service is None or service.status != ServiceStatus.ACTIVE:
            raise NotFoundError("Service not available")
        available = await check_slot_available(
            db,
            service=service,
            starts_at=starts_at,
            ends_at=ends_at,
            exclude_booking_id=booking.id,
        )
        if not available:
            raise ForbiddenError("Selected time slot is not available")

    old_starts = booking.starts_at
    booking.starts_at = starts_at
    booking.ends_at = ends_at
    if stylist_id is not None:
        booking.stylist_id = target_stylist_id

    # Recalculate free cancellation deadline
    deadline = free_cancel_deadline_at(
        starts_at=starts_at, policy_data=booking.policy_snapshot_json
    )
    booking.free_cancel_deadline_at = deadline

    await append_ledger(
        db,
        event_type="BOOKING_RESCHEDULED",
        payload={
            "booking_id": str(booking.id),
            "old_starts_at": old_starts.isoformat(),
            "new_starts_at": starts_at.isoformat(),
            "new_ends_at": ends_at.isoformat(),
            "stylist_id": str(target_stylist_id) if target_stylist_id else None,
        },
        org_id=booking.org_id,
        booking_id=booking.id,
        amount=Decimal("0.00"),
        currency="USD",
    )
    await db.flush()
    return booking
