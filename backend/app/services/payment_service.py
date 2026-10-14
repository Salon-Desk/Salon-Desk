import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.booking import Booking
from app.models.consent import Consent
from app.models.enums import (
    BookingStatus,
    PaymentCaptureType,
    PaymentHoldStatus,
)
from app.models.ledger import LedgerEntry
from app.models.payment import PaymentCapture, PaymentHold, PaypalWebhookEvent
from app.services.audit_service import append_ledger_hash, build_consent_signature
from app.services.paypal_rest import PayPalRestClient

GENESIS_HASH = "0" * 64


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
) -> PaymentHold:
    existing = await db.execute(
        select(PaymentHold).where(PaymentHold.idempotency_key == idempotency_key)
    )
    found = existing.scalar_one_or_none()
    if found:
        return found

    consent = await db.execute(select(Consent).where(Consent.booking_id == booking.id).limit(1))
    if consent.scalar_one_or_none() is None:
        raise ForbiddenError("Consent required before authorization hold")

    paypal = PayPalRestClient()
    paypal_result = await paypal.authorize_order(amount=booking.total_price, currency=currency)

    hold = PaymentHold(
        booking_id=booking.id,
        org_id=booking.org_id,
        paypal_order_id=paypal_result.get("order_id") or f"stub-order-{booking.id}",
        paypal_authorization_id=paypal_result.get("authorization_id") or f"stub-auth-{booking.id}",
        amount=booking.total_price,
        currency=currency,
        status=PaymentHoldStatus.AUTHORIZED,
        honor_expires_at=datetime.now(UTC) + timedelta(days=3),
        idempotency_key=idempotency_key,
    )
    db.add(hold)
    booking.status = BookingStatus.CONFIRMED
    await db.flush()

    await append_ledger(
        db,
        event_type="AUTHORIZATION_CREATED",
        payload={"hold_id": str(hold.id), "paypal": paypal_result},
        org_id=booking.org_id,
        booking_id=booking.id,
        hold_id=hold.id,
        amount=hold.amount,
        currency=hold.currency,
    )
    return hold


async def get_active_hold(db: AsyncSession, booking_id: UUID) -> PaymentHold | None:
    result = await db.execute(
        select(PaymentHold)
        .where(
            PaymentHold.booking_id == booking_id,
            PaymentHold.status.in_(
                [
                    PaymentHoldStatus.AUTHORIZED,
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
) -> PaymentCapture:
    hold = await get_active_hold(db, booking.id)
    if hold is None:
        raise NotFoundError("No active payment hold for booking")

    capture_amount = amount if amount is not None else hold.amount
    if capture_type == PaymentCaptureType.NO_SHOW_FEE and amount is None:
        capture_amount = (hold.amount * Decimal("0.50")).quantize(Decimal("0.01"))

    paypal = PayPalRestClient()
    paypal_result = await paypal.partial_capture(
        authorization_id=hold.paypal_authorization_id or "",
        amount=capture_amount,
    )

    capture = PaymentCapture(
        hold_id=hold.id,
        booking_id=booking.id,
        paypal_capture_id=paypal_result.get("capture_id") or f"stub-capture-{booking.id}",
        amount=capture_amount,
        currency=hold.currency,
        capture_type=capture_type,
        status="COMPLETED",
        paypal_debug_id=paypal_result.get("debug_id"),
    )
    db.add(capture)

    if capture_type == PaymentCaptureType.FULL or capture_amount >= hold.amount:
        hold.status = PaymentHoldStatus.CAPTURED
        booking.status = BookingStatus.COMPLETED
        event_type = "FULL_PAYMENT_CAPTURED"
    elif capture_type == PaymentCaptureType.NO_SHOW_FEE:
        hold.status = PaymentHoldStatus.PARTIALLY_CAPTURED
        booking.status = BookingStatus.NO_SHOW
        event_type = "NO_SHOW_FEE_CAPTURED"
    else:
        hold.status = PaymentHoldStatus.PARTIALLY_CAPTURED
        event_type = "PARTIAL_PAYMENT_CAPTURED"

    await db.flush()
    await append_ledger(
        db,
        event_type=event_type,
        payload={
            "capture_id": str(capture.id),
            "capture_type": capture_type.value,
            "paypal": paypal_result,
        },
        org_id=booking.org_id,
        booking_id=booking.id,
        hold_id=hold.id,
        amount=capture_amount,
        currency=hold.currency,
        paypal_debug_id=capture.paypal_debug_id,
    )
    return capture


async def void_hold(db: AsyncSession, *, booking: Booking) -> PaymentHold | None:
    hold = await get_active_hold(db, booking.id)
    if hold is None:
        return None

    paypal = PayPalRestClient()
    paypal_result = await paypal.void_authorization(
        authorization_id=hold.paypal_authorization_id or ""
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
            select(PaymentHold).where(PaymentHold.paypal_authorization_id == str(auth_id))
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
