"""T9 AI agent tools for PayPal checkout, status inspection, and capture."""

from __future__ import annotations

import json
import logging
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.exceptions import SalonDeskError
from app.models.enums import UserRole
from app.models.user import User
from app.services.paypal_toolkit import (
    PayPalToolkitRunner,
)

logger = logging.getLogger("salondesk.ai.paypal_tools")


async def handle_paypal_agent_chat(
    db: AsyncSession,
    message: str,
    user: User | None = None,
) -> tuple[bool, str, dict[str, Any] | None]:
    """Handle direct chat requests for PayPal orders, checkout, and status checks.

    Returns:
        (handled, reply_text, metadata_dict)
    """
    lowered = message.lower()
    paypal_triggers = (
        "paypal order",
        "paypal deposit",
        "create order",
        "create a paypal",
        "pay order",
        "capture order",
        "check paypal",
        "check order",
        "paypal checkout",
        "order status",
    )
    if not any(trigger in lowered for trigger in paypal_triggers):
        return False, "", None

    # Resolve user or demo client
    client = user
    if client is None:
        res = await db.execute(
            select(User)
            .where(User.email == "client@example.com", User.role == UserRole.CLIENT)
            .limit(1)
        )
        client = res.scalar_one_or_none()

    if client is None:
        res = await db.execute(select(User).where(User.role == UserRole.CLIENT).limit(1))
        client = res.scalar_one_or_none()

    if client is None:
        return (
            True,
            "Please sign in before executing a PayPal checkout order or capture.",
            None,
        )

    runner = PayPalToolkitRunner()
    result = await runner.run(message, user=client, db=db)

    if result.get("status") == "success":
        action = result.get("action")
        meta = {
            "action": action,
            "order_id": result.get("order_id"),
            "amount": result.get("amount"),
            "approval_url": result.get("approval_url"),
            "data": result.get("data"),
        }
        return True, result.get("message", "PayPal operation successful."), meta
    elif result.get("status") == "error":
        return True, f"PayPal Agent Notice: {result.get('message')}", None

    return False, "", None


def build_paypal_agent_tools(
    session_factory: async_sessionmaker[AsyncSession],
) -> list:
    """Return LiveKit ``@function_tool`` callables for T9 PayPal agent actions."""
    try:
        from livekit.agents import function_tool
    except ImportError:  # pragma: no cover
        return []

    @function_tool()
    async def create_paypal_checkout_order(
        amount: float,
        service_name: str = "Salon Deposit",
        client_email: str | None = None,
    ) -> str:
        """Create a PayPal CAPTURE checkout order with security caps.

        Use this when a customer says: 'create a $15 PayPal order for my haircut' or
        'I want to pay a $10 deposit with PayPal'.
        """
        async with session_factory() as db:
            client: User | None = None
            if client_email:
                res = await db.execute(
                    select(User).where(User.email == client_email.strip().lower()).limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                res = await db.execute(
                    select(User)
                    .where(User.email == "client@example.com", User.role == UserRole.CLIENT)
                    .limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "User must be authenticated to create a PayPal checkout order.",
                    }
                )

            amount_dec = Decimal(str(round(amount, 2)))
            runner = PayPalToolkitRunner()
            try:
                out = await runner.create_order(
                    amount=amount_dec,
                    service_name=service_name,
                    client_id=client.id,
                    currency="USD",
                    db=db,
                )
                await db.commit()
                return json.dumps(
                    {
                        "status": "success",
                        "order_id": out.get("order_id"),
                        "amount": str(amount_dec),
                        "approval_url": out.get("approval_url"),
                        "message": (
                            f"Created PayPal order {out.get('order_id')} for ${amount_dec:.2f}. "
                            f"Approve at: {out.get('approval_url')}"
                        ),
                    }
                )
            except SalonDeskError as exc:
                return json.dumps({"status": "error", "message": exc.message})

    @function_tool()
    async def check_paypal_order_status(order_id: str) -> str:
        """Query the status of an existing PayPal order.

        Use when client asks: 'What is the status of my PayPal order?' or 'Check order <ORDER_ID>'.
        """
        runner = PayPalToolkitRunner()
        try:
            data = await runner.get_order(order_id=order_id)
            st = data.get("status", "UNKNOWN")
            return json.dumps(
                {
                    "status": "success",
                    "order_id": order_id,
                    "order_status": st,
                    "message": f"PayPal Order {order_id} is currently {st}.",
                }
            )
        except SalonDeskError as exc:
            return json.dumps({"status": "error", "message": exc.message})

    @function_tool()
    async def capture_paypal_order(
        order_id: str,
        client_email: str | None = None,
    ) -> str:
        """Capture payment on an approved PayPal order.

        Use when the client says: 'I approved order <ORDER_ID>, please capture it' or
        'Pay order <ORDER_ID>'.
        """
        async with session_factory() as db:
            client: User | None = None
            if client_email:
                res = await db.execute(
                    select(User).where(User.email == client_email.strip().lower()).limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                res = await db.execute(
                    select(User)
                    .where(User.email == "client@example.com", User.role == UserRole.CLIENT)
                    .limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "User must be authenticated to capture a PayPal order.",
                    }
                )

            runner = PayPalToolkitRunner()
            try:
                res = await runner.pay_order(order_id=order_id, client_id=client.id, db=db)
                await db.commit()
                return json.dumps(
                    {
                        "status": "success",
                        "order_id": order_id,
                        "capture_id": res.get("capture_id"),
                        "message": f"Payment for order {order_id} has been captured and completed.",
                    }
                )
            except SalonDeskError as exc:
                return json.dumps({"status": "error", "message": exc.message})

    return [create_paypal_checkout_order, check_paypal_order_status, capture_paypal_order]
