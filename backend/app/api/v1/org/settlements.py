from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession, OrgMember
from app.core.exceptions import ForbiddenError, NotFoundError, PolicyViolationException
from app.models.enums import PaymentCaptureType
from app.schemas.booking import BookingOut, booking_to_out
from app.schemas.payment import PaymentCaptureOut, PaymentHoldOut
from app.services import booking_service
from app.services.payment_service import capture_hold, reauthorize_hold
from app.services.policy_engine import assert_can_settle

router = APIRouter(prefix="/settlements", tags=["org-settlements"])


def _assert_org_booking(user, booking) -> None:
    assert_can_settle(user.role, user.org_id, booking.org_id)


def _http_for(exc: Exception) -> int:
    if isinstance(exc, ForbiddenError):
        return status.HTTP_403_FORBIDDEN
    if isinstance(exc, NotFoundError):
        return status.HTTP_404_NOT_FOUND
    if isinstance(exc, PolicyViolationException):
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
