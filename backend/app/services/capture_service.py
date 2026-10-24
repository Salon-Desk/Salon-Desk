"""Capture funds against an authorized PayPal hold."""

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, PolicyViolationException
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentCaptureType, PaymentHoldStatus
from app.models.payment import PaymentCapture
from app.services.hold_service import get_active_hold
from app.services.ledger_service import append_ledger
from app.services.paypal_rest import PayPalRestClient


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

    snapshot = booking.commission_snapshot or {}
    platform_fee_on_booking = Decimal(str(snapshot.get("amount") or "0"))
    full_settlement_amount = (booking.total_price + platform_fee_on_booking).quantize(
        Decimal("0.01")
    )

    if capture_type == PaymentCaptureType.FULL:
        capture_amount = amount if amount is not None else full_settlement_amount
        final_capture = True
    elif capture_type == PaymentCaptureType.NO_SHOW_FEE:
        capture_amount = amount if amount is not None else booking.agreed_no_show_fee
        final_capture = True
        if capture_amount > booking.agreed_no_show_fee:
            raise PolicyViolationException(
                f"No-show fee {capture_amount} exceeds agreed_no_show_fee "
                f"{booking.agreed_no_show_fee}"
            )
    elif capture_type == PaymentCaptureType.LATE_CANCEL:
        capture_amount = amount if amount is not None else booking.agreed_late_cancel_fee
        final_capture = True
        if capture_amount > booking.agreed_late_cancel_fee:
            raise PolicyViolationException(
                f"Late-cancel fee {capture_amount} exceeds agreed_late_cancel_fee "
                f"{booking.agreed_late_cancel_fee}"
            )
    else:
        capture_amount = amount if amount is not None else hold.amount

    remaining = hold.amount - hold.captured_amount
    if capture_amount > remaining:
        raise PolicyViolationException(
            f"Capture {capture_amount} would exceed authorized ceiling "
            f"(remaining {remaining} of {hold.amount})"
        )
    if capture_type == PaymentCaptureType.FULL and capture_amount > full_settlement_amount:
        raise PolicyViolationException(
            f"Full capture {capture_amount} exceeds agreed settlement "
            f"{full_settlement_amount} (service {booking.total_price} + platform fee "
            f"{platform_fee_on_booking})"
        )

    paypal = PayPalRestClient()
    cap_request_id = f"cap-{hold.id}-{hold.captured_amount + capture_amount}"
    paypal_result = await paypal.partial_capture(
        authorization_id=hold.latest_authorization_id or hold.parent_authorization_id or "",
        amount=capture_amount,
        final_capture=final_capture,
        paypal_request_id=cap_request_id,
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
    elif capture_type == PaymentCaptureType.LATE_CANCEL:
        event_type = "LATE_CANCEL_FEE_CAPTURED"
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
