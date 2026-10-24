"""Inbound PayPal webhook events applied to local holds."""

from datetime import UTC, datetime

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PaymentHoldStatus
from app.models.payment import PaymentHold, PaypalWebhookEvent
from app.services.ledger_service import append_ledger

_HOLD_EVENT_TYPES = {
    "PAYMENT.AUTHORIZATION.VOIDED",
    "PAYMENT.CAPTURE.COMPLETED",
    "PAYMENT.AUTHORIZATION.CREATED",
}


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
    if auth_id and event_type in _HOLD_EVENT_TYPES:
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
                await append_ledger(
                    db,
                    event_type="WEBHOOK_HOLD_VOIDED",
                    payload=resource,
                    org_id=hold.org_id,
                    booking_id=hold.booking_id,
                    hold_id=hold.id,
                    amount=hold.amount,
                    currency=hold.currency,
                )
            elif event_type == "PAYMENT.CAPTURE.COMPLETED":
                hold.status = PaymentHoldStatus.CAPTURED
                await append_ledger(
                    db,
                    event_type="WEBHOOK_CAPTURE_COMPLETED",
                    payload=resource,
                    org_id=hold.org_id,
                    booking_id=hold.booking_id,
                    hold_id=hold.id,
                    amount=hold.amount,
                    currency=hold.currency,
                )
            await db.flush()
    elif event_type in {
        "PAYMENT.CAPTURE.REFUNDED",
        "PAYMENT.CAPTURE.REVERSED",
    } or event_type.startswith("CUSTOMER.DISPUTE."):
        await append_ledger(
            db,
            event_type=f"WEBHOOK_{event_type.replace('.', '_')}",
            payload=resource,
        )

    event.processed_at = datetime.now(UTC)
    await db.flush()
    return event
