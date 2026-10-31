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
