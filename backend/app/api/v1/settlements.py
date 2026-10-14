from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession, OrgMember
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.enums import PaymentCaptureType, UserRole
from app.schemas.booking import BookingOut
from app.schemas.payment import PaymentCaptureOut
from app.services import booking_service
from app.services.payment_service import capture_hold

router = APIRouter(prefix="/settlements", tags=["settlements"])


def _assert_org_booking(user, booking) -> None:
    if user.org_id != booking.org_id:
        raise ForbiddenError("Booking belongs to another organization")
    if user.role not in {UserRole.ORG_OWNER, UserRole.RECEPTION}:
        raise ForbiddenError("Insufficient permissions")


@router.post("/{booking_id}/mark-show", response_model=PaymentCaptureOut)
async def mark_show(booking_id: UUID, user: OrgMember, db: DbSession) -> PaymentCaptureOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
        _assert_org_booking(user, booking)
        capture = await capture_hold(db, booking=booking, capture_type=PaymentCaptureType.FULL)
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return PaymentCaptureOut.model_validate(capture)


@router.post("/{booking_id}/mark-no-show", response_model=PaymentCaptureOut)
async def mark_no_show(booking_id: UUID, user: OrgMember, db: DbSession) -> PaymentCaptureOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
        _assert_org_booking(user, booking)
        capture = await capture_hold(
            db, booking=booking, capture_type=PaymentCaptureType.NO_SHOW_FEE
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return PaymentCaptureOut.model_validate(capture)


@router.get("/{booking_id}", response_model=BookingOut)
async def get_settlement_booking(booking_id: UUID, user: OrgMember, db: DbSession) -> BookingOut:
    try:
        booking = await booking_service.get_booking(db, booking_id)
        _assert_org_booking(user, booking)
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return BookingOut.model_validate(booking)
