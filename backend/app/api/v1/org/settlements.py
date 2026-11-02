from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession, OrgMember
from app.core.exceptions import ForbiddenError, NotFoundError, PolicyViolationException
from app.models.enums import PaymentCaptureType
from app.schemas.booking import BookingOut, BookingRescheduleRequest, booking_to_out
from app.schemas.dispute import SlotRescueResponse, WaitlistEntryOut
from app.schemas.payment import PaymentCaptureOut, PaymentHoldOut
from app.services import booking_service
from app.services.payment_service import capture_hold, reauthorize_hold
from app.services.policy_engine import assert_can_settle
from app.services.slot_rescue_service import SlotRescueService

router = APIRouter(prefix="/settlements", tags=["org-settlements"])


def _assert_org_booking(user, booking) -> None:
    assert_can_settle(user.role, user.org_id, booking.org_id)


def _http_for(exc: Exception) -> int:
    if isinstance(exc, ForbiddenError):
        return status.HTTP_403_FORBIDDEN
    if isinstance(exc, NotFoundError):
        return status.HTTP_404_NOT_FOUND
    if isinstance(exc, PolicyViolationException):
        if getattr(exc, "status_code", None) == 422:
            return status.HTTP_422_UNPROCESSABLE_ENTITY
        if getattr(exc, "code", None) in {
            "REAUTHORIZATION_TOO_SOON",
            "HOLD_EXPIRED",
            "RESCHEDULE_LIMIT_EXCEEDED",
            "BOOKING_HORIZON_EXCEEDED",
        }:
            return status.HTTP_422_UNPROCESSABLE_ENTITY
        if "reschedule" in exc.message.lower() or "deposit holds" in exc.message.lower():
            return status.HTTP_422_UNPROCESSABLE_ENTITY
        return status.HTTP_400_BAD_REQUEST
    return status.HTTP_400_BAD_REQUEST


@router.post("/{booking_id}/mark-show", response_model=PaymentCaptureOut)
async def mark_show(booking_id: UUID, user: OrgMember, db: DbSession) -> PaymentCaptureOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
        _assert_org_booking(user, booking)
        capture = await capture_hold(
            db,
            booking=booking,
            capture_type=PaymentCaptureType.FULL,
            amount=booking.total_price,
            final_capture=True,
        )
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc
    return PaymentCaptureOut.model_validate(capture)


@router.post("/{booking_id}/mark-no-show", response_model=PaymentCaptureOut)
async def mark_no_show(booking_id: UUID, user: OrgMember, db: DbSession) -> PaymentCaptureOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
        _assert_org_booking(user, booking)
        capture = await capture_hold(
            db,
            booking=booking,
            capture_type=PaymentCaptureType.NO_SHOW_FEE,
            amount=booking.agreed_no_show_fee,
            final_capture=True,
        )
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc
    return PaymentCaptureOut.model_validate(capture)


@router.post("/{booking_id}/reauthorize", response_model=PaymentHoldOut)
async def reauthorize(booking_id: UUID, user: OrgMember, db: DbSession) -> PaymentHoldOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
        _assert_org_booking(user, booking)
        hold = await reauthorize_hold(db, booking=booking)
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc
    return PaymentHoldOut.model_validate(hold)


@router.get("/{booking_id}", response_model=BookingOut)
async def get_settlement_booking(booking_id: UUID, user: OrgMember, db: DbSession) -> BookingOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
        _assert_org_booking(user, booking)
    except (ForbiddenError, NotFoundError) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc
    return booking_to_out(booking)


@router.patch("/{booking_id}/reschedule", response_model=BookingOut)
async def org_reschedule_booking(
    booking_id: UUID,
    body: BookingRescheduleRequest,
    user: OrgMember,
    db: DbSession,
) -> BookingOut:
    """Salon staff rescheduling endpoint for active bookings."""
    try:
        booking = await booking_service.get_booking(db, booking_id)
        _assert_org_booking(user, booking)
        rescheduled = await booking_service.reschedule_booking(
            db,
            booking=booking,
            actor_id=user.id,
            starts_at=body.starts_at,
            ends_at=body.ends_at,
            stylist_id=body.stylist_id,
            is_org=True,
        )
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc
    return booking_to_out(rescheduled)


@router.post("/{booking_id}/rescue-slot", response_model=SlotRescueResponse)
async def rescue_slot(
    booking_id: UUID,
    user: OrgMember,
    db: DbSession,
    waitlist_entry_id: UUID | None = None,
) -> SlotRescueResponse:
    """Execute Slot Rescue: refill late-cancelled/no-show chair from waitlist and void hold or refund fee."""
    try:
        service = SlotRescueService()
        result = await service.execute_slot_rescue(
            db,
            booking_id=booking_id,
            waitlist_entry_id=waitlist_entry_id,
            actor_user=user,
        )
        return SlotRescueResponse(
            status=result["status"],
            action=result["action"],
            waived_amount=result["waived_amount"],
            refund_amount=result["refund_amount"],
            original_booking_id=result["original_booking_id"],
            replacement_booking_id=result["replacement_booking_id"],
            waitlist_entry_id=result["waitlist_entry_id"],
            replacement_client_name=result["replacement_client_name"],
            paypal_result=result["paypal_result"],
            negotiation_rounds=result["negotiation_rounds"],
        )
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc


@router.get("/{booking_id}/waitlist", response_model=list[WaitlistEntryOut])
async def list_booking_waitlist(
    booking_id: UUID,
    user: OrgMember,
    db: DbSession,
) -> list[WaitlistEntryOut]:
    """List eligible waitlist candidates waiting for a slot at this salon."""
    try:
        service = SlotRescueService()
        entries = await service.list_waitlist_candidates(db, booking_id=booking_id)
        return [WaitlistEntryOut.model_validate(e) for e in entries]
    except (ForbiddenError, NotFoundError, PolicyViolationException) as exc:
        raise HTTPException(_http_for(exc), detail=exc.message) from exc
