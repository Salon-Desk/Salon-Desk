"""Unit and integration tests for AI Agent PayPal integration and security restrictions."""

import uuid
from decimal import Decimal

import pytest

from app.core.exceptions import ForbiddenError, PolicyViolationException
from app.models.enums import UserRole
from app.models.user import User
from app.services.paypal_toolkit import (
    PayPalToolkitRunner,
)


@pytest.mark.asyncio
async def test_agent_create_order_security_ceiling() -> None:
    runner = PayPalToolkitRunner()
    client_id = uuid.uuid4()

    # Reject excessive amount above MAX_TRANSACTION_AMOUNT ($250)
    with pytest.raises(PolicyViolationException, match="exceeds security ceiling"):
        await runner.create_order(
            amount=Decimal("500.00"),
            service_name="Balayage",
            client_id=client_id,
        )

    # Reject amount below MIN_TRANSACTION_AMOUNT ($0.50)
    with pytest.raises(PolicyViolationException, match="below minimum allowed deposit"):
        await runner.create_order(
            amount=Decimal("0.10"),
            service_name="Touchup",
            client_id=client_id,
        )

    # Reject unsupported currency
    with pytest.raises(PolicyViolationException, match="not supported"):
        await runner.create_order(
            amount=Decimal("25.00"),
            service_name="Haircut",
            client_id=client_id,
            currency="EUR",
        )


@pytest.mark.asyncio
async def test_agent_create_order_requires_auth() -> None:
    runner = PayPalToolkitRunner()
    with pytest.raises(ForbiddenError, match="Authentication required"):
        await runner.create_order(
            amount=Decimal("20.00"),
            service_name="Haircut",
            client_id=None,  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_agent_create_order_stub_success() -> None:
    runner = PayPalToolkitRunner()
    client_id = uuid.uuid4()
    res = await runner.create_order(
        amount=Decimal("15.00"),
        service_name="Haircut deposit",
        client_id=client_id,
    )
    assert res["status"] == "CREATED"
    assert "STUB-CAP-" in res["order_id"]
    assert "token=" in res["approval_url"]
    assert res["amount"] == "15.00"


@pytest.mark.asyncio
async def test_agent_pay_order_stub_success() -> None:
    runner = PayPalToolkitRunner()
    client_id = uuid.uuid4()
    res = await runner.pay_order(
        order_id="STUB-CAP-1234567890abcdef",
        client_id=client_id,
    )
    assert res["status"] == "COMPLETED"
    assert "stub-capture-" in res["capture_id"]


@pytest.mark.asyncio
async def test_agent_run_natural_language_agent() -> None:
    runner = PayPalToolkitRunner()
    user = User(
        id=uuid.uuid4(),
        email="test_client@example.com",
        role=UserRole.CLIENT,
        password_hash="x",
    )

    # 1. Create order
    out = await runner.run("Create a $12.50 USD order for haircut deposit", user=user)
    assert out["status"] == "success"
    assert out["action"] == "create_order"
    assert out["amount"] == "12.50"
    assert "approval_url" in out

    # 2. Capture order
    order_id = out["order_id"]
    pay_out = await runner.run(f"Pay and capture order {order_id}", user=user)
    assert pay_out["status"] == "success"
    assert pay_out["action"] == "pay_order"
    assert pay_out["order_id"] == order_id


@pytest.mark.asyncio
async def test_agent_authorize_hold_and_void() -> None:
    runner = PayPalToolkitRunner()
    client_id = uuid.uuid4()

    # 1. Authorize hold with security ceilings
    res = await runner.authorize_hold(
        amount=Decimal("30.00"),
        service_name="Braids hold",
        client_id=client_id,
    )
    assert res["status"] == "CREATED"
    assert "STUB-" in res["order_id"]
    assert "token=" in res["approval_url"]

    # 2. Void authorization
    void_res = await runner.void_hold(
        authorization_id="STUB-AUTH-12345",
        client_id=client_id,
        reason="Free cancellation within policy",
    )
    assert void_res["status"] == "VOIDED"
    assert void_res["authorization_id"] == "STUB-AUTH-12345"


@pytest.mark.asyncio
async def test_agent_blocked_agent_tools_firewall() -> None:
    runner = PayPalToolkitRunner()
    with pytest.raises(PolicyViolationException, match="prohibited by SalonDesk policy"):
        await runner.accept_dispute_claim(dispute_id="PP-D-12345")


def test_paypal_mcp_tool_schemas() -> None:
    from app.ai.tools.paypal_tools import PAYPAL_MCP_TOOL_SCHEMAS

    names = {tool["name"] for tool in PAYPAL_MCP_TOOL_SCHEMAS}
    assert "paypal_authorize_appointment_hold" in names
    assert "paypal_capture_settlement" in names
    assert "paypal_void_hold" in names
    assert "paypal_get_dispute_status" in names
