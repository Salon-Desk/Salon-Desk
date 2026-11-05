"""Tests for client no-show fee capture email notification."""

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.models.booking import Booking
from app.models.payment import PaymentCapture
from app.models.service import Service
from app.services.email_service import send_no_show_fee_captured_email
from app.services.payment_notification_service import send_no_show_fee_notification


@pytest.mark.asyncio
async def test_send_no_show_fee_captured_email_invokes_send_email_safe() -> None:
    with patch("app.services.email_service.send_email_safe", new_callable=AsyncMock) as mock_send:
        mock_send.return_value = True

        ok = await send_no_show_fee_captured_email(
            to_address="client@example.com",
            client_name="Hana Tesfaye",
            service_name="Braids",
            salon_name="Selam Hair Studio",
            starts_at_label="Saturday, 3:00 PM",
            no_show_fee="30.00",
            booking_id="b-12345",
            paypal_capture_id="CAP-TEST-123",
        )

        assert ok is True
        mock_send.assert_awaited_once()
        args = mock_send.call_args.args
        kwargs = mock_send.call_args.kwargs
        assert kwargs["to_address"] == "client@example.com"
        assert "No-Show Fee Processed" in args[0]
        assert "$30.00 USD" in args[1]
        assert "remainder of your authorization hold has been released" in args[1]


@pytest.mark.asyncio
async def test_send_no_show_fee_notification_dispatches_to_client_and_platform() -> None:
    mock_db = AsyncMock()

    # Mock user query
    mock_user = MagicMock()
    mock_user.email = "hana.tesfaye@example.et"
    mock_user.profile = MagicMock()
    mock_user.profile.first_name = "Hana"

    # Mock org
    mock_org = MagicMock()
    mock_org.name = "Selam Salon"

    # Mock booking service line with real Service instance
    mock_bs = MagicMock()
    real_service = Service(
        name="Cornrows",
        base_price=Decimal("80.00"),
        duration_minutes=60,
    )
    mock_bs.service = real_service

    mock_user_res = MagicMock()
    mock_user_res.scalar_one_or_none.return_value = mock_user

    mock_bs_res = MagicMock()
    mock_bs_res.scalar_one_or_none.return_value = mock_bs

    mock_db.execute.side_effect = [mock_user_res, mock_bs_res]
    mock_db.get.return_value = mock_org

    booking = MagicMock(spec=Booking)
    booking.id = uuid4()
    booking.client_id = uuid4()
    booking.org_id = uuid4()
    booking.starts_at = MagicMock()
    booking.starts_at.strftime.return_value = "2026-10-31 15:00 UTC"

    capture = MagicMock(spec=PaymentCapture)
    capture.amount = Decimal("30.00")
    capture.paypal_capture_id = "CAP-TEST-888"

    with (
        patch(
            "app.services.email_service.send_no_show_fee_captured_email", new_callable=AsyncMock
        ) as mock_client_email,
        patch(
            "app.services.email_service.notify_platform", new_callable=AsyncMock
        ) as mock_platform,
    ):
        mock_client_email.return_value = True
        mock_platform.return_value = True

        await send_no_show_fee_notification(mock_db, booking, capture)

        mock_client_email.assert_awaited_once_with(
            to_address="hana.tesfaye@example.et",
            client_name="Hana",
            service_name="Cornrows",
            salon_name="Selam Salon",
            starts_at_label="2026-10-31 15:00 UTC",
            no_show_fee="30.00",
            booking_id=str(booking.id),
            paypal_capture_id="CAP-TEST-888",
        )
        mock_platform.assert_awaited_once()
