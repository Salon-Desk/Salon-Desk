import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError, PolicyViolationException
from app.models.booking import Booking
from app.models.enums import (
    BookingStatus,
    PaymentCaptureType,
    PaymentHoldStatus,
)
from app.models.ledger import LedgerEntry
from app.models.payment import PaymentCapture, PaymentHold, PaypalWebhookEvent
from app.models.policy import Consent
from app.services.ledger_service import append_ledger_hash, build_consent_signature
from app.services.paypal_rest import PayPalRestClient

GENESIS_HASH = "0" * 64
MAX_REAUTHORIZATION_COUNT = 1


async def _latest_ledger_hash(db: AsyncSession) -> str:
    result = await db.execute(select(LedgerEntry).order_by(LedgerEntry.created_at.desc()).limit(1))
    entry = result.scalar_one_or_none()
    return entry.entry_hash if entry else GENESIS_HASH


async def append_ledger(
    db: AsyncSession,
    *,
    event_type: str,
    payload: dict,
    org_id: UUID | None = None,
    booking_id: UUID | None = None,
    hold_id: UUID | None = None,
    amount: Decimal | None = None,
    currency: str | None = None,
    paypal_debug_id: str | None = None,
) -> LedgerEntry:
    previous = await _latest_ledger_hash(db)
    payload_str = json.dumps(payload, sort_keys=True, default=str)
    entry = LedgerEntry(
        org_id=org_id,
        booking_id=booking_id,
        hold_id=hold_id,
        event_type=event_type,
        amount=amount,
        currency=currency,
        payload_json=payload,
        previous_hash=previous,
        entry_hash=append_ledger_hash(previous, payload_str),
        paypal_debug_id=paypal_debug_id,
    )
    db.add(entry)
    await db.flush()
    return entry


async def create_consent(
    db: AsyncSession,
    *,
    booking: Booking,
    client_id: UUID,
    terms_version: str,
    terms_text: str,
    signed_payload: str,
) -> Consent:
    if booking.client_id != client_id:
        raise ForbiddenError("Not your booking")
    terms_hash, signature = build_consent_signature(terms_text)
    consent = Consent(
        booking_id=booking.id,
        client_id=client_id,
        terms_version=terms_version,
        terms_text_hash=terms_hash,
        signature_b64=signature,
        signed_payload=signed_payload,
    )
    db.add(consent)
    await db.flush()
    return consent


async def create_hold(
    db: AsyncSession,
    *,
    booking: Booking,
    idempotency_key: str,
    currency: str = "USD",
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
            settings = get_settings()
            base = settings.frontend_base_url.rstrip("/")
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
    settings = get_settings()
    base = settings.frontend_base_url.rstrip("/")

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
    await _notify_booking_confirmed(db, booking=booking)
    return hold


async def _notify_booking_confirmed(db: AsyncSession, *, booking: Booking) -> None:
    """Email client confirmation + ops notification after hold authorization."""
    from sqlalchemy.orm import selectinload

    from app.models.booking import BookingService
    from app.models.organization import Organization
    from app.models.service import Service
    from app.models.user import User
    from app.services import email_service

    client_result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == booking.client_id)
    )
    client = client_result.scalar_one_or_none()
    org = await db.get(Organization, booking.org_id)

    service_name = "Appointment"
    bs_result = await db.execute(
        select(BookingService)
        .options(selectinload(BookingService.service))
        .where(BookingService.booking_id == booking.id)
        .limit(1)
    )
    first_line = bs_result.scalar_one_or_none()
    if first_line is not None and isinstance(first_line.service, Service):
        service_name = first_line.service.name

    client_name = "there"
    client_email = None
    if client is not None:
        client_email = client.email
        if client.profile is not None:
            client_name = client.profile.first_name or client_name

    starts_label = booking.starts_at.strftime("%Y-%m-%d %H:%M %Z") or booking.starts_at.isoformat()
    free_label = (
        booking.free_cancel_deadline_at.strftime("%Y-%m-%d %H:%M %Z")
        or booking.free_cancel_deadline_at.isoformat()
    )
    salon_name = org.name if org else "Salon"

    if client_email:
        await email_service.send_booking_confirmation_email(
            to_address=client_email,
            client_name=client_name,
            service_name=service_name,
            salon_name=salon_name,
            starts_at_label=starts_label,
            hold_amount=str(booking.agreed_hold_amount),
            no_show_fee=str(booking.agreed_no_show_fee),
            free_cancel_deadline=free_label,
            booking_id=str(booking.id),
        )

    await email_service.notify_platform(
        subject=f"New booking confirmed — {salon_name}",
        body=(
            f"Booking {booking.id} confirmed at {salon_name}.\n"
            f"Client: {client_name} <{client_email or 'n/a'}>\n"
            f"Service: {service_name}\n"
            f"When: {starts_label}\n"
            f"Hold: ${booking.agreed_hold_amount}\n"
        ),
    )


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


async def capture_hold(
    db: AsyncSession,
    *,
    booking: Booking,
    capture_type: PaymentCaptureType,
    amount: Decimal | None = None,
    final_capture: bool = False,
) -> PaymentCapture:
    hold = await get_active_hold(db, booking.id)
    if hold is None:
        raise NotFoundError("No active payment hold for booking")

    if capture_type == PaymentCaptureType.FULL:
        capture_amount = amount if amount is not None else booking.total_price
        final_capture = True
    elif capture_type == PaymentCaptureType.NO_SHOW_FEE:
        capture_amount = amount if amount is not None else booking.agreed_no_show_fee
        final_capture = True
        if capture_amount > booking.agreed_no_show_fee:
            raise PolicyViolationException(
                f"No-show fee {capture_amount} exceeds agreed_no_show_fee "
                f"{booking.agreed_no_show_fee}"
            )
    else:
        capture_amount = amount if amount is not None else hold.amount

    remaining = hold.amount - hold.captured_amount
    if capture_amount > remaining:
        raise PolicyViolationException(
            f"Capture {capture_amount} would exceed authorized ceiling "
            f"(remaining {remaining} of {hold.amount})"
        )
    if capture_type == PaymentCaptureType.FULL and capture_amount > booking.total_price:
        raise PolicyViolationException(
            f"Full capture {capture_amount} exceeds booking total_price {booking.total_price}"
        )

    paypal = PayPalRestClient()
    paypal_result = await paypal.partial_capture(
        authorization_id=hold.latest_authorization_id or hold.parent_authorization_id or "",
        amount=capture_amount,
    )

    capture = PaymentCapture(
        hold_id=hold.id,
        booking_id=booking.id,
        paypal_capture_id=paypal_result.get("capture_id") or f"stub-capture-{booking.id}",
        amount=capture_amount,
        currency=hold.currency,
        capture_type=capture_type,
        final_capture=final_capture,
        status="COMPLETED",
        paypal_debug_id=paypal_result.get("debug_id"),
    )
    db.add(capture)

    hold.captured_amount = (hold.captured_amount + capture_amount).quantize(Decimal("0.01"))

    if final_capture or hold.captured_amount >= hold.amount:
        hold.status = PaymentHoldStatus.CAPTURED
    else:
        hold.status = PaymentHoldStatus.PARTIALLY_CAPTURED

    if capture_type == PaymentCaptureType.FULL:
        booking.status = BookingStatus.COMPLETED
        event_type = "FULL_PAYMENT_CAPTURED"
    elif capture_type == PaymentCaptureType.NO_SHOW_FEE:
        if booking.status != BookingStatus.CANCELLED:
            booking.status = BookingStatus.NO_SHOW
        event_type = "NO_SHOW_FEE_CAPTURED"
    else:
        event_type = "PARTIAL_PAYMENT_CAPTURED"

    await db.flush()
    await append_ledger(
        db,
        event_type=event_type,
        payload={
            "capture_id": str(capture.id),
            "capture_type": capture_type.value,
            "final_capture": final_capture,
            "paypal": paypal_result,
        },
        org_id=booking.org_id,
        booking_id=booking.id,
        hold_id=hold.id,
        amount=capture_amount,
        currency=hold.currency,
        paypal_debug_id=capture.paypal_debug_id,
    )

    # Lazy import avoids circular dependency with commission_billing_service
    from app.services.commission_billing_service import accrue_commission_for_capture

    await accrue_commission_for_capture(db, booking=booking, capture=capture)
    return capture


async def void_hold(db: AsyncSession, *, booking: Booking) -> PaymentHold | None:
    hold = await get_active_hold(db, booking.id)
    if hold is None:
        return None

    paypal = PayPalRestClient()
    paypal_result = await paypal.void_authorization(
        authorization_id=hold.parent_authorization_id or hold.latest_authorization_id or ""
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

    parent_id = hold.parent_authorization_id or hold.latest_authorization_id or ""
    paypal = PayPalRestClient()
    paypal_result = await paypal.reauthorize_authorization(authorization_id=parent_id)
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


async def ingest_webhook(
    db: AsyncSession,
    *,
    paypal_event_id: str,
    event_type: str,
    resource: dict,
    verification_status: str = "VERIFIED",
) -> PaypalWebhookEvent:
    existing = await db.execute(
        select(PaypalWebhookEvent).where(PaypalWebhookEvent.paypal_event_id == paypal_event_id)
    )
    found = existing.scalar_one_or_none()
    if found:
        return found

    event = PaypalWebhookEvent(
        paypal_event_id=paypal_event_id,
        event_type=event_type,
        resource_json=resource,
        verification_status=verification_status,
    )
    db.add(event)
    await db.flush()

    auth_id = resource.get("id") or resource.get("authorization_id")
    if auth_id and event_type in {
        "PAYMENT.AUTHORIZATION.VOIDED",
        "PAYMENT.CAPTURE.COMPLETED",
        "PAYMENT.AUTHORIZATION.CREATED",
    }:
        hold_result = await db.execute(
            select(PaymentHold).where(
                or_(
                    PaymentHold.parent_authorization_id == str(auth_id),
                    PaymentHold.latest_authorization_id == str(auth_id),
                )
            )
        )
        hold = hold_result.scalar_one_or_none()
        if hold:
            if event_type == "PAYMENT.AUTHORIZATION.VOIDED":
                hold.status = PaymentHoldStatus.VOIDED
            elif event_type == "PAYMENT.CAPTURE.COMPLETED":
                hold.status = PaymentHoldStatus.CAPTURED
            await db.flush()

    event.processed_at = datetime.now(UTC)
    await db.flush()
    return event
