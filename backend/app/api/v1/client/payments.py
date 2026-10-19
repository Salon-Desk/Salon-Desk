import re
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import ClientUser, DbSession
from app.core.config import get_settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.payment import PaymentHold
from app.schemas.payment import CompleteHoldRequest, CreateHoldRequest, PaymentHoldOut
from app.services import booking_service
from app.services.payment_service import complete_hold, create_hold
from app.services.paypal_rest import PayPalAPIError

router = APIRouter(prefix="/payments", tags=["payments"])


def _paypal_http_error(exc: PayPalAPIError) -> HTTPException:
    detail = exc.message
    if exc.debug_id:
        detail = f"{detail} [debug_id {exc.debug_id}]"
    return HTTPException(status.HTTP_502_BAD_GATEWAY, detail=detail)


def _trusted_origin(request: Request) -> str | None:
    """
    The site the buyer is checking out on, so PayPal sends them back there rather than to
    FRONTEND_BASE_URL. Only CORS-allowed origins are trusted for the redirect.
    """
    origin = (request.headers.get("origin") or "").rstrip("/")
    if not origin:
        return None
    settings = get_settings()
    if origin in settings.cors_origins:
        return origin
    if settings.cors_origin_regex and re.fullmatch(settings.cors_origin_regex, origin):
        return origin
    return None


def _hold_out(hold: PaymentHold, approval_url: str | None = None) -> PaymentHoldOut:
    out = PaymentHoldOut.model_validate(hold)
    if approval_url:
        return out.model_copy(update={"approval_url": approval_url})
    return out


@router.post(
    "/holds",
    response_model=PaymentHoldOut,
    status_code=status.HTTP_201_CREATED,
)
async def authorize_hold(
    body: CreateHoldRequest, user: ClientUser, db: DbSession, request: Request
) -> PaymentHoldOut:
    """Create a PayPal AUTHORIZE order and return the buyer approval link."""
    try:
        booking = await booking_service.get_booking(db, body.booking_id)
        if booking.client_id != user.id:
            raise ForbiddenError("Not your booking")
        hold, approval_url = await create_hold(
            db,
            booking=booking,
            idempotency_key=body.idempotency_key,
            currency=body.currency,
            frontend_base=_trusted_origin(request),
        )
    except PayPalAPIError as exc:
        raise _paypal_http_error(exc) from exc
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return _hold_out(hold, approval_url)


@router.post("/holds/{hold_id}/complete", response_model=PaymentHoldOut)
async def complete_authorization_hold(
    hold_id: UUID,
    body: CompleteHoldRequest,
    user: ClientUser,
    db: DbSession,
) -> PaymentHoldOut:
    """After PayPal approval, authorize the order and confirm the booking."""
    hold = await db.get(PaymentHold, hold_id)
    if hold is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Hold not found")
    try:
        booking = await booking_service.get_booking(db, hold.booking_id)
        if booking.client_id != user.id:
            raise ForbiddenError("Not your booking")
        hold = await complete_hold(
            db,
            hold=hold,
            paypal_order_token=body.paypal_order_token,
        )
    except PayPalAPIError as exc:
        raise _paypal_http_error(exc) from exc
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return _hold_out(hold)
