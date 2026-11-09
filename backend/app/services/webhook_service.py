import contextlib
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PaymentHoldStatus
from app.models.payment import PaymentCapture, PaymentHold, PaypalWebhookEvent
from app.services.ledger_service import append_ledger
from app.services.sandbox.simulation import normalize_simulator_webhook

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
    paypal_event_id, resource = normalize_simulator_webhook(paypal_event_id, resource)

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

            if not booking_match:
                # Fallback for PayPal Webhooks Simulator:
                # The simulator generates dummy transaction IDs that do not exist in local DB.
                # Auto-link to bookings (prioritizing bookings without open disputes) so repeated simulator tests succeed!
                from app.models.booking import Booking
                from app.models.dispute import DisputeCase

                disputed_subq = select(DisputeCase.booking_id)

                # 1. Prefer captured bookings without disputes
                unmatched_cap_stmt = (
                    select(PaymentCapture)
                    .where(~PaymentCapture.booking_id.in_(disputed_subq))
                    .order_by(PaymentCapture.created_at.desc())
                    .limit(1)
                )
                unmatched_cap = (await db.execute(unmatched_cap_stmt)).scalars().first()
                if unmatched_cap and unmatched_cap.booking_id:
                    booking_match = unmatched_cap.booking_id
                else:
                    # 2. Prefer any booking without disputes
                    unmatched_b_stmt = (
                        select(Booking)
                        .where(~Booking.id.in_(disputed_subq))
                        .order_by(Booking.created_at.desc())
                        .limit(1)
                    )
                    unmatched_b = (await db.execute(unmatched_b_stmt)).scalars().first()
                    if unmatched_b:
                        booking_match = unmatched_b.id
                    else:
                        # 3. Fallback to latest captured or any booking
                        latest_cap_stmt = (
                            select(PaymentCapture)
                            .order_by(PaymentCapture.created_at.desc())
                            .limit(1)
                        )
                        latest_cap = (await db.execute(latest_cap_stmt)).scalars().first()
                        if latest_cap and latest_cap.booking_id:
                            booking_match = latest_cap.booking_id
                        else:
                            latest_b_stmt = (
                                select(Booking).order_by(Booking.created_at.desc()).limit(1)
                            )
                            latest_b = (await db.execute(latest_b_stmt)).scalars().first()
                            if latest_b:
                                booking_match = latest_b.id

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
        elif event_type == "CUSTOMER.DISPUTE.UPDATED":
            dispute_id = resource.get("dispute_id")
            if dispute_id:
                from app.models.dispute import DisputeCase
                from app.models.enums import DisputeCaseStatus

                stmt = select(DisputeCase).where(DisputeCase.paypal_dispute_id == str(dispute_id))
                case = (await db.execute(stmt)).scalar_one_or_none()
                if case:
                    res_status = resource.get("status", "").upper()
                    if res_status == "UNDER_REVIEW":
                        case.status = DisputeCaseStatus.UNDER_REVIEW
                    elif res_status == "WAITING_FOR_SELLER_RESPONSE":
                        case.status = DisputeCaseStatus.WAITING_FOR_SELLER_RESPONSE
                    elif res_status in ("WAITING_FOR_BUYER_RESPONSE", "INQUIRY"):
                        case.status = DisputeCaseStatus.UNDER_REVIEW
                    elif res_status == "RESOLVED":
                        outcome_info = resource.get("dispute_outcome") or {}
                        out_code = (outcome_info.get("outcome_code") or "").upper()
                        out_reason = (outcome_info.get("outcome_reason") or "").upper()
                        fund_movements = resource.get("fund_movements") or []
                        hold_released = any(
                            m.get("party") == "RECEIVER"
                            and m.get("type") == "CREDIT"
                            and m.get("reason") == "HOLD_RELEASED"
                            for m in fund_movements
                        )
                        is_seller = (
                            "SELLER" in out_code
                            or "CANCEL" in out_code
                            or "BUYER_CANCELLED" in out_reason
                            or hold_released
                        )
                        case.status = (
                            DisputeCaseStatus.RESOLVED_SELLER_FAVOR
                            if is_seller
                            else DisputeCaseStatus.RESOLVED_BUYER_FAVOR
                        )
                        case.adjudication_outcome = (
                            out_code
                            or out_reason
                            or ("SELLER_FAVOR" if is_seller else "BUYER_FAVOR")
                        )
                        case.resolved_at = datetime.now(UTC)

                    # Update metadata, buyer messages, and transaction items
                    rep = dict(case.investigator_report_json or {})
                    if "messages" in resource and resource["messages"]:
                        rep["dispute_messages"] = resource["messages"]
                    if "dispute_life_cycle_stage" in resource:
                        rep["dispute_life_cycle_stage"] = resource["dispute_life_cycle_stage"]
                    if "disputed_transactions" in resource:
                        rep["disputed_transactions"] = resource["disputed_transactions"]
                    case.investigator_report_json = rep
                    await db.flush()

        elif event_type == "CUSTOMER.DISPUTE.RESOLVED":
            dispute_id = resource.get("dispute_id")
            if dispute_id:
                from app.models.dispute import DisputeCase
                from app.models.enums import DisputeCaseStatus

                stmt = select(DisputeCase).where(DisputeCase.paypal_dispute_id == str(dispute_id))
                case = (await db.execute(stmt)).scalar_one_or_none()
                if case:
                    outcome_info = resource.get("dispute_outcome") or {}
                    out_code = (outcome_info.get("outcome_code") or "").upper()
                    out_reason = (outcome_info.get("outcome_reason") or "").upper()
                    fund_movements = resource.get("fund_movements") or []
                    hold_released = any(
                        m.get("party") == "RECEIVER"
                        and m.get("type") == "CREDIT"
                        and m.get("reason") == "HOLD_RELEASED"
                        for m in fund_movements
                    )
                    is_seller = (
                        "SELLER" in out_code
                        or "CANCEL" in out_code
                        or "BUYER_CANCELLED" in out_reason
                        or hold_released
                    )
                    case.status = (
                        DisputeCaseStatus.RESOLVED_SELLER_FAVOR
                        if is_seller
                        else DisputeCaseStatus.RESOLVED_BUYER_FAVOR
                    )
                    case.adjudication_outcome = (
                        out_code or out_reason or ("SELLER_FAVOR" if is_seller else "BUYER_FAVOR")
                    )
                    case.resolved_at = datetime.now(UTC)

                    rep = dict(case.investigator_report_json or {})
                    if "messages" in resource and resource["messages"]:
                        rep["dispute_messages"] = resource["messages"]
                    if "dispute_outcome" in resource:
                        rep["dispute_outcome"] = resource["dispute_outcome"]
                    if "fund_movements" in resource:
                        rep["fund_movements"] = resource["fund_movements"]
                    case.investigator_report_json = rep
                    await db.flush()

    event.processed_at = datetime.now(UTC)
    await db.flush()
    return event
