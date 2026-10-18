from datetime import datetime, timedelta
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
    ServiceStatus,
)
from app.models.ledger import PlatformCommission
from app.models.organization import Organization
from app.models.policy import OrgCancellationPolicy
from app.models.service import Service
from app.models.user import User
from app.services.availability_service import check_slot_available, get_availability
from app.services.payment_service import capture_hold, void_hold
from app.services.policy_engine import (
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
]

_BOOKING_LOAD_OPTIONS = (
    selectinload(Booking.organization),
    selectinload(Booking.client).selectinload(User.profile),
    selectinload(Booking.stylist).selectinload(User.profile),
    selectinload(Booking.booking_services).selectinload(BookingService.service),
)

_DEFAULT_POLICY = {"free_cancel_hours": 24, "no_show_fee_percent": 50}


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


async def _commission_rule_for_service(db: AsyncSession, service: Service) -> dict:
    result = await db.execute(
        select(PlatformCommission)
        .where(PlatformCommission.service_category_id == service.service_category_id)
        .order_by(PlatformCommission.created_at.desc())
        .limit(1)
    )
    commission = result.scalar_one_or_none()
    if commission is None:
        return {"type": "percentage", "percentage": "0", "flat": None, "commission_id": None}
    return {
        "type": commission.type.value,
        "percentage": str(commission.percentage) if commission.percentage is not None else None,
        "flat": str(commission.flat) if commission.flat is not None else None,
        "commission_id": str(commission.id),
    }


def _commission_amount(rule: dict, price: Decimal) -> Decimal:
    amount = Decimal("0")
    if rule.get("percentage") is not None:
        amount += (price * Decimal(str(rule["percentage"])) / Decimal("100")).quantize(
            Decimal("0.01")
        )
    if rule.get("flat") is not None:
        amount += Decimal(str(rule["flat"]))
    return amount


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

    primary = services[0]
    available = await check_slot_available(
        db,
        service=primary,
        starts_at=starts_at,
        ends_at=ends_at,
    )
    if not available:
        raise ForbiddenError("Selected time slot is not available")

    policy_snapshot = await _load_active_policy(db, org_id)
    no_show_fee = agreed_no_show_fee(total_price=total_price, policy_data=policy_snapshot)
    deadline = free_cancel_deadline_at(starts_at=starts_at, policy_data=policy_snapshot)

    primary_rule = await _commission_rule_for_service(db, primary)
    expected_commission = _commission_amount(primary_rule, total_price)
    commission_snapshot = {
        **primary_rule,
        "amount": str(expected_commission),
    }

    booking = Booking(
        org_id=org_id,
        client_id=client_id,
        stylist_id=stylist_id,
        starts_at=starts_at,
        ends_at=ends_at,
        status=BookingStatus.PENDING,
        total_price=total_price,
        agreed_hold_amount=total_price,
        agreed_no_show_fee=no_show_fee,
        free_cancel_deadline_at=deadline,
        policy_snapshot_json=policy_snapshot,
        commission_snapshot=commission_snapshot,
        customer_notes=customer_notes,
    )
    db.add(booking)
    await db.flush()

    for service in services:
        line_rule = await _commission_rule_for_service(db, service)
        db.add(
            BookingService(
                booking_id=booking.id,
                service_id=service.id,
                base_price=service.base_price,
                service_policy_snapshot_json=policy_snapshot,
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


async def list_client_bookings(db: AsyncSession, client_id: UUID) -> list[Booking]:
    result = await db.execute(
        select(Booking)
        .options(*_BOOKING_LOAD_OPTIONS)
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
        fee = booking.agreed_no_show_fee
        await capture_hold(
            db,
            booking=booking,
            capture_type=PaymentCaptureType.NO_SHOW_FEE,
            amount=fee,
            final_capture=True,
        )
        fee_json = {
            "fee": str(fee),
            "reason": "late_cancel",
            "bounded_by": "agreed_no_show_fee",
        }

    booking.status = BookingStatus.CANCELLED
    booking.cancellation_reason = reason
    booking.cancellation_fee_json = fee_json
    await db.flush()
    return booking
