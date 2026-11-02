"""PayPal authorization hold lifecycle: create, complete, void, and reauthorize."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentHoldStatus
from app.models.payment import PaymentHold
from app.models.policy import Consent
from app.services.ledger_service import append_ledger
from app.services.payment_notification_service import send_booking_confirmation_notification
from app.services.paypal_rest import PayPalRestClient
from app.services.policy_engine import assert_can_reauthorize_hold

MAX_REAUTHORIZATION_COUNT = 1


async def create_hold(
    db: AsyncSession,
    *,
    booking: Booking,
    idempotency_key: str,
    currency: str = "USD",
    frontend_base: str | None = None,
) -> tuple[PaymentHold, str | None]:
    """
    Create a PayPal AUTHORIZE order and a PENDING hold.

    Returns (hold, approval_url). The client must open approval_url, then call
    complete_hold to finalize authorization and confirm the booking.
    """
    from app.core.config import get_settings
    from app.models.enums import OrgAccountStatus
    from app.models.payment import OrgAccount

    existing = await db.execute(
        select(PaymentHold).where(PaymentHold.idempotency_key == idempotency_key)
    )
    found = existing.scalar_one_or_none()
    if found is not None:
        # Re-issue approval link for incomplete holds.
        if found.status == PaymentHoldStatus.PENDING and found.paypal_order_id:
            base = (frontend_base or get_settings().frontend_base_url).rstrip("/")
            approval = (
                f"{base}/client/paypal/return?hold_id={found.id}&token={found.paypal_order_id}"
            )
            if str(found.paypal_order_id).startswith("STUB-"):
                approval = f"{approval}&stub=1"
            return found, approval
        return found, None

    consent = await db.execute(select(Consent).where(Consent.booking_id == booking.id).limit(1))
    if consent.scalar_one_or_none() is None:
        raise ForbiddenError("Consent required before authorization hold")

    hold_amount = booking.agreed_hold_amount
    base = (frontend_base or get_settings().frontend_base_url).rstrip("/")

    # Persist hold first so return_url can include hold_id.
    hold = PaymentHold(
        booking_id=booking.id,
        org_id=booking.org_id,
        paypal_order_id=None,
        parent_authorization_id=None,
        latest_authorization_id=None,
        amount=hold_amount,
        captured_amount=Decimal("0.00"),
        currency=currency,
        status=PaymentHoldStatus.PENDING,
        honor_expires_at=None,
        reauthorization_count=0,
        idempotency_key=idempotency_key,
    )
    db.add(hold)
    await db.flush()

    return_url = f"{base}/client/paypal/return?hold_id={hold.id}"
    cancel_url = f"{base}/client/book?paypal=cancelled&booking_id={booking.id}"

    payee_merchant_id = None
    acct = await db.execute(
        select(OrgAccount).where(
            OrgAccount.org_id == booking.org_id,
            OrgAccount.status == OrgAccountStatus.APPROVED,
        )
    )
    org_account = acct.scalar_one_or_none()
    if org_account is not None and org_account.merchant_id:
        payee_merchant_id = org_account.merchant_id

    paypal = PayPalRestClient()
    paypal_result = await paypal.create_authorize_order(
        amount=hold_amount,
        currency=currency,
        return_url=return_url,
        cancel_url=cancel_url,
        payee_merchant_id=payee_merchant_id,
        reference_id=str(booking.id),
        paypal_request_id=f"order-{hold.id}",
    )

    hold.paypal_order_id = paypal_result.get("order_id")
    await db.flush()

    await append_ledger(
        db,
        event_type="AUTHORIZATION_ORDER_CREATED",
        payload={"hold_id": str(hold.id), "paypal": paypal_result},
        org_id=booking.org_id,
        booking_id=booking.id,
        hold_id=hold.id,
        amount=hold.amount,
        currency=hold.currency,
    )
    return hold, paypal_result.get("approval_url")


async def complete_hold(
    db: AsyncSession,
    *,
    hold: PaymentHold,
    paypal_order_token: str | None = None,
) -> PaymentHold:
    """Authorize a buyer-approved PayPal order and confirm the booking."""
    if hold.status in {
        PaymentHoldStatus.AUTHORIZED,
        PaymentHoldStatus.REAUTHORIZED,
        PaymentHoldStatus.CAPTURED,
        PaymentHoldStatus.PARTIALLY_CAPTURED,
    }:
        return hold
    if hold.status != PaymentHoldStatus.PENDING:
        raise ForbiddenError(f"Hold cannot be completed from status {hold.status}")

    order_id = paypal_order_token or hold.paypal_order_id
    if not order_id:
        raise ForbiddenError("Missing PayPal order token")

    booking = await db.get(Booking, hold.booking_id)
    if booking is None:
        raise NotFoundError("Booking not found")

    paypal = PayPalRestClient()
    paypal_result = await paypal.authorize_order(
        order_id=order_id,
        amount=hold.amount,
        currency=hold.currency,
    )
    auth_id = paypal_result.get("authorization_id") or f"stub-auth-{hold.id}"
    hold.paypal_order_id = order_id
    hold.parent_authorization_id = auth_id
    hold.latest_authorization_id = auth_id
    hold.status = PaymentHoldStatus.AUTHORIZED
    hold.honor_expires_at = datetime.now(UTC) + timedelta(days=3)
    booking.status = BookingStatus.CONFIRMED
    await db.flush()

    await append_ledger(
        db,
        event_type="AUTHORIZATION_CREATED",
        payload={"hold_id": str(hold.id), "paypal": paypal_result},
        org_id=hold.org_id,
        booking_id=hold.booking_id,
        hold_id=hold.id,
        amount=hold.amount,
        currency=hold.currency,
    )
    await send_booking_confirmation_notification(db, booking=booking)
    return hold


async def get_active_hold(db: AsyncSession, booking_id: UUID) -> PaymentHold | None:
    result = await db.execute(
        select(PaymentHold)
        .where(
            PaymentHold.booking_id == booking_id,
            PaymentHold.status.in_(
                [
                    PaymentHoldStatus.AUTHORIZED,
                    PaymentHoldStatus.REAUTHORIZED,
                    PaymentHoldStatus.PARTIALLY_CAPTURED,
                ]
            ),
        )
        .order_by(PaymentHold.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def void_hold(db: AsyncSession, *, booking: Booking) -> PaymentHold | None:
    hold = await get_active_hold(db, booking.id)
    if hold is None:
        return None

    paypal = PayPalRestClient()
    paypal_result = await paypal.void_authorization(
        authorization_id=hold.parent_authorization_id or hold.latest_authorization_id or "",
        paypal_request_id=f"void-{hold.id}",
    )
    hold.status = PaymentHoldStatus.VOIDED
    await db.flush()
    await append_ledger(
        db,
        event_type="AUTHORIZATION_VOIDED",
        payload={"hold_id": str(hold.id), "paypal": paypal_result},
        org_id=booking.org_id,
        booking_id=booking.id,
        hold_id=hold.id,
        amount=hold.amount,
        currency=hold.currency,
    )
    return hold


async def reauthorize_hold(db: AsyncSession, *, booking: Booking) -> PaymentHold:
    hold = await get_active_hold(db, booking.id)
    if hold is None:
        raise NotFoundError("No active payment hold for booking")
    if hold.reauthorization_count >= MAX_REAUTHORIZATION_COUNT:
        raise ForbiddenError("Hold has already been reauthorized (max 1)")
    if hold.status not in {
        PaymentHoldStatus.AUTHORIZED,
        PaymentHoldStatus.REAUTHORIZED,
    }:
        raise ForbiddenError("Only AUTHORIZED or REAUTHORIZED holds can be reauthorized")

    assert_can_reauthorize_hold(hold)

    parent_id = hold.parent_authorization_id or hold.latest_authorization_id or ""
    paypal = PayPalRestClient()
    paypal_result = await paypal.reauthorize_authorization(
        authorization_id=parent_id,
        hold=hold,
        paypal_request_id=f"reauth-{hold.id}-{hold.reauthorization_count + 1}",
    )
    new_auth_id = (
        paypal_result.get("authorization_id")
        or f"stub-reauth-{booking.id}-{hold.reauthorization_count + 1}"
    )

    if hold.parent_authorization_id is None:
        hold.parent_authorization_id = parent_id or new_auth_id
    hold.latest_authorization_id = new_auth_id
    hold.reauthorization_count += 1
    hold.status = PaymentHoldStatus.REAUTHORIZED
    hold.honor_expires_at = datetime.now(UTC) + timedelta(days=3)
    await db.flush()

    await append_ledger(
        db,
        event_type="HONOR_PERIOD_REAUTHORIZED",
        payload={
            "hold_id": str(hold.id),
            "parent_authorization_id": hold.parent_authorization_id,
            "latest_authorization_id": hold.latest_authorization_id,
            "reauthorization_count": hold.reauthorization_count,
            "paypal": paypal_result,
        },
        org_id=booking.org_id,
        booking_id=booking.id,
        hold_id=hold.id,
        amount=hold.amount,
        currency=hold.currency,
    )
    return hold
