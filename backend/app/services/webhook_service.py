import contextlib
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PaymentHoldStatus
from app.models.payment import PaymentCapture, PaymentHold, PaypalWebhookEvent
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
        if event_type == "CUSTOMER.DISPUTE.CREATED":
            dispute_id = resource.get("dispute_id")
            reason = resource.get("reason", "MERCHANDISE_OR_SERVICE_NOT_RECEIVED")
            dispute_amt_dict = resource.get("dispute_amount") or {}
            amt_val = None
            if dispute_amt_dict.get("value"):
                with contextlib.suppress(Exception):
                    amt_val = Decimal(str(dispute_amt_dict["value"]))

            booking_match: UUID | None = None
            tx_ids = []
            for tx in resource.get("disputed_transactions", []):
                if tx.get("seller_transaction_id"):
                    tx_ids.append(tx["seller_transaction_id"])
                if tx.get("buyer_transaction_id"):
                    tx_ids.append(tx["buyer_transaction_id"])

            if tx_ids:
                stmt = select(PaymentCapture).where(PaymentCapture.paypal_capture_id.in_(tx_ids))
                cap = (await db.execute(stmt)).scalars().first()
                if cap and cap.booking_id:
                    booking_match = cap.booking_id

            if not booking_match and resource.get("custom_id"):
                with contextlib.suppress(Exception):
                    booking_match = UUID(resource["custom_id"])

            if booking_match:
                from app.services.dispute_service import DisputeService

                ds = DisputeService()
                with contextlib.suppress(Exception):
                    await ds.run_dispute_counsel_analysis(
                        db,
                        booking_id=booking_match,
                        paypal_dispute_id=dispute_id,
                        reason=reason,
                        dispute_amount=amt_val,
                    )

    event.processed_at = datetime.now(UTC)
    await db.flush()
    return event
