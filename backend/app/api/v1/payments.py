from fastapi import APIRouter, HTTPException, status

from app.api.deps import ClientUser, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.schemas.payment import CreateHoldRequest, PaymentHoldOut
from app.services import booking_service
from app.services.payment_service import create_hold

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post(
    "/holds",
    response_model=PaymentHoldOut,
    status_code=status.HTTP_201_CREATED,
)
async def authorize_hold(
    body: CreateHoldRequest, user: ClientUser, db: DbSession
) -> PaymentHoldOut:
    try:
        booking = await booking_service.get_booking(db, body.booking_id)
        if booking.client_id != user.id:
            raise ForbiddenError("Not your booking")
        hold = await create_hold(
            db,
            booking=booking,
            idempotency_key=body.idempotency_key,
            currency=body.currency,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return PaymentHoldOut.model_validate(hold)
