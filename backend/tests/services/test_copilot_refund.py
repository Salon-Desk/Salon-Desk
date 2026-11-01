"""Tests for Owner AI Copilot Goodwill Refund drafting and PayPal HITL approval."""

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.ai.copilot_refund import (
    GOODWILL_REFUND_CEILING,
    extract_refund_amount,
    handle_copilot_goodwill_refund,
    is_goodwill_refund_request,
)


def test_is_goodwill_refund_request() -> None:
    assert is_goodwill_refund_request("Draft a $15 goodwill refund for Hana.")
    assert is_goodwill_refund_request("Draft a goodwill refund for Hana")
    assert is_goodwill_refund_request("Please issue a partial refund of $10 to the client")
    assert is_goodwill_refund_request("Refund for Hana")
    assert not is_goodwill_refund_request("What are the salon hours?")
    assert not is_goodwill_refund_request("Book an appointment for braids tomorrow")


def test_extract_refund_amount() -> None:
    assert extract_refund_amount("Draft a $15 goodwill refund for Hana.") == Decimal("15.00")
    assert extract_refund_amount("Draft a $25.50 goodwill refund") == Decimal("25.50")
    assert (
        extract_refund_amount("Refund $50 to Hana") == GOODWILL_REFUND_CEILING
    )  # Capped at $30.00 Max
    assert extract_refund_amount("Draft goodwill refund for Hana") == Decimal("15.00")  # Default


@pytest.mark.asyncio
async def test_handle_copilot_goodwill_refund() -> None:
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_res

    handled, reply, proposed = await handle_copilot_goodwill_refund(
        mock_db,
        "Draft a $15 goodwill refund for Hana.",
    )

    assert handled is True
    assert "@paypal/agent-toolkit" in reply
    assert proposed is not None
    assert proposed.action_type == "GOODWILL_REFUND"
    assert proposed.payload["client_name"] == "Hana Tesfaye"
    assert proposed.payload["refund_amount"] == "15.00"
    assert proposed.payload["security_ceiling"] == "30.00"
    assert proposed.payload["toolkit_action"] == "get_order"
    assert proposed.payload["toolkit_verified"] is True


@pytest.mark.asyncio
async def test_approve_copilot_refund_captures_active_hold_and_refunds() -> None:
    from unittest.mock import patch
    from uuid import uuid4

    from app.api.v1.client.assistant import approve_copilot_refund
    from app.models.booking import Booking
    from app.models.enums import BookingStatus, PaymentHoldStatus
    from app.models.payment import PaymentCapture, PaymentHold
    from app.schemas.ai import CopilotRefundRequest

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_res
    booking_id = uuid4()
    org_id = uuid4()

    mock_hold = MagicMock(spec=PaymentHold)
    mock_hold.status = PaymentHoldStatus.AUTHORIZED
    mock_hold.amount = Decimal("56.10")
    mock_hold.latest_authorization_id = "8JL57900YX194480G"

    mock_booking = MagicMock(spec=Booking)
    mock_booking.id = booking_id
    mock_booking.org_id = org_id
    mock_booking.status = BookingStatus.CONFIRMED
    mock_booking.total_price = Decimal("55.00")
    mock_booking.agreed_hold_amount = Decimal("56.10")
    mock_booking.agreed_no_show_fee = Decimal("27.50")
    mock_booking.payment_captures = []
    mock_booking.payment_holds = [mock_hold]

    mock_db.get.return_value = mock_booking

    mock_captured = MagicMock(spec=PaymentCapture)
    mock_captured.paypal_capture_id = "2GG9988776655"

    with (
        patch(
            "app.api.v1.client.assistant.capture_hold",
            new=AsyncMock(return_value=mock_captured),
        ) as mock_capture_call,
        patch(
            "app.api.v1.client.assistant.PayPalToolkitRunner.refund_order",
            new=AsyncMock(return_value={"status": "COMPLETED", "refund_id": "REF-PP-TEST-1234"}),
        ) as mock_refund_call,
        patch(
            "app.api.v1.client.assistant.append_ledger",
            new=AsyncMock(),
        ),
    ):
        body = CopilotRefundRequest(
            booking_id=str(booking_id),
            capture_id="8JL57900YX194480G",  # Authorization ID passed
            refund_amount=Decimal("15.00"),
            client_name="Abebe Bikila",
        )
        res = await approve_copilot_refund(body=body, db=mock_db)

        assert res.status == "success"
        assert res.refund_id == "REF-PP-TEST-1234"
        assert res.capture_id == "2GG9988776655"
        mock_capture_call.assert_awaited_once()
        mock_refund_call.assert_awaited_once_with(
            capture_id="2GG9988776655",
            amount=Decimal("15.00"),
            reason="Owner goodwill refund approved for Abebe Bikila",
            staff_id=None,
            db=mock_db,
        )
