"""PayPal Agent Toolkit & T9 checkout runner with security restrictions."""

from __future__ import annotations

import logging
import re
import uuid
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ForbiddenError, PolicyViolationException, SalonDeskError
from app.models.user import User
from app.services.ledger_service import append_ledger
from app.services.paypal_rest import PayPalRestClient

logger = logging.getLogger("salondesk.paypal_toolkit")

# Security restrictions
MIN_TRANSACTION_AMOUNT = Decimal("0.50")
MAX_TRANSACTION_AMOUNT = Decimal("250.00")
ALLOWED_CURRENCIES = frozenset({"USD"})
BLOCKED_AGENT_TOOLS = frozenset({"accept_dispute_claim"})


def assert_tool_allowed(tool_name: str) -> None:
    """Validate that an agent is not attempting to invoke a prohibited autonomous tool."""
    clean_tool = (tool_name or "").strip().lower()
    if clean_tool in BLOCKED_AGENT_TOOLS:
        raise PolicyViolationException(
            f"Autonomous execution of '{tool_name}' is prohibited by SalonDesk policy. "
            "Dispute claims cannot be accepted without Human-in-the-Loop staff authorization."
        )


class PayPalToolkitRunner:
    """T9 AI agent checkout runner for PayPal Orders v2 (intent=CAPTURE) and refunds."""

    def __init__(self, rest_client: PayPalRestClient | None = None) -> None:
        self.client = rest_client or PayPalRestClient()
        self.settings = get_settings()

    async def create_order(
        self,
        *,
        amount: Decimal,
        service_name: str,
        client_id: UUID,
        currency: str = "USD",
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """T9 Agent create_order with strict ceiling and auth restrictions."""
        if not client_id:
            raise ForbiddenError("Authentication required to create a checkout order")

        currency_clean = (currency or "USD").upper().strip()
        if currency_clean not in ALLOWED_CURRENCIES:
            raise PolicyViolationException(
                f"Currency {currency_clean} is not supported. Allowed: {', '.join(ALLOWED_CURRENCIES)}"
            )

        if amount < MIN_TRANSACTION_AMOUNT:
            raise PolicyViolationException(
                f"Amount ${amount:.2f} is below minimum allowed deposit of ${MIN_TRANSACTION_AMOUNT:.2f}"
            )
        if amount > MAX_TRANSACTION_AMOUNT:
            raise PolicyViolationException(
                f"Amount ${amount:.2f} exceeds security ceiling limit of ${MAX_TRANSACTION_AMOUNT:.2f}"
            )

        base = self.settings.frontend_base_url.rstrip("/")
        req_id = f"t9-create-{client_id}-{uuid.uuid4().hex[:12]}"
        return_url = f"{base}/client/paypal/return?intent=capture&client_id={client_id}"
        cancel_url = f"{base}/client/book?paypal=cancelled"

        res = await self.client.create_capture_order(
            amount=amount,
            currency=currency_clean,
            return_url=return_url,
            cancel_url=cancel_url,
            description=f"SalonDesk: {service_name[:100]}",
            reference_id=str(client_id),
            paypal_request_id=req_id,
        )

        if db is not None:
            await append_ledger(
                db,
                event_type="T9_AGENT_ORDER_CREATED",
                payload={
                    "client_id": str(client_id),
                    "service_name": service_name,
                    "order_id": res.get("order_id"),
                    "amount": str(amount),
                    "currency": currency_clean,
                },
                amount=amount,
                currency=currency_clean,
            )

        return res

    async def authorize_hold(
        self,
        *,
        amount: Decimal,
        service_name: str,
        client_id: UUID,
        currency: str = "USD",
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """T9 Agent authorize_hold: creates an Orders v2 authorization hold (intent=AUTHORIZE)."""
        assert_tool_allowed("authorize_hold")
        if not client_id:
            raise ForbiddenError("Authentication required to place an authorization hold")

        currency_clean = (currency or "USD").upper().strip()
        if currency_clean not in ALLOWED_CURRENCIES:
            raise PolicyViolationException(
                f"Currency {currency_clean} is not supported. Allowed: {', '.join(ALLOWED_CURRENCIES)}"
            )

        if amount < MIN_TRANSACTION_AMOUNT:
            raise PolicyViolationException(
                f"Amount ${amount:.2f} is below minimum allowed deposit of ${MIN_TRANSACTION_AMOUNT:.2f}"
            )
        if amount > MAX_TRANSACTION_AMOUNT:
            raise PolicyViolationException(
                f"Amount ${amount:.2f} exceeds security ceiling limit of ${MAX_TRANSACTION_AMOUNT:.2f}"
            )

        base = self.settings.frontend_base_url.rstrip("/")
        req_id = f"t9-auth-{client_id}-{uuid.uuid4().hex[:12]}"
        return_url = f"{base}/client/paypal/return?intent=authorize&client_id={client_id}"
        cancel_url = f"{base}/client/book?paypal=cancelled"

        res = await self.client.create_authorize_order(
            amount=amount,
            currency=currency_clean,
            return_url=return_url,
            cancel_url=cancel_url,
            reference_id=str(client_id),
            paypal_request_id=req_id,
        )

        if db is not None:
            await append_ledger(
                db,
                event_type="T9_AGENT_HOLD_AUTHORIZED",
                payload={
                    "client_id": str(client_id),
                    "service_name": service_name,
                    "order_id": res.get("order_id"),
                    "amount": str(amount),
                    "currency": currency_clean,
                },
                amount=amount,
                currency=currency_clean,
            )

        return res

    async def void_hold(
        self,
        *,
        authorization_id: str,
        client_id: UUID,
        reason: str | None = None,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """T9 Agent void_hold: voids an active PayPal authorization hold."""
        assert_tool_allowed("void_hold")
        if not client_id:
            raise ForbiddenError("Authentication required to void a hold")

        auth_id_clean = str(authorization_id).strip()
        if not auth_id_clean:
            raise PolicyViolationException("Valid authorization_id is required")

        req_id = f"t9-void-{auth_id_clean}-{uuid.uuid4().hex[:8]}"
        res = await self.client.void_authorization(
            authorization_id=auth_id_clean,
            paypal_request_id=req_id,
        )

        if db is not None:
            await append_ledger(
                db,
                event_type="T9_AGENT_HOLD_VOIDED",
                payload={
                    "client_id": str(client_id),
                    "authorization_id": auth_id_clean,
                    "reason": reason or "Client cancelled or slot rescued",
                },
            )

        return {"authorization_id": auth_id_clean, **res}

    async def accept_dispute_claim(
        self,
        *,
        dispute_id: str,
        db: AsyncSession | None = None,
    ) -> None:
        """Prohibited autonomous action: accepting dispute claims requires staff authorization."""
        assert_tool_allowed("accept_dispute_claim")

    async def pay_order(
        self,
        *,
        order_id: str,
        client_id: UUID,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """T9 Agent pay_order: captures buyer-approved order with status guards."""
        if not client_id:
            raise ForbiddenError("Authentication required to capture an order")

        order_id = str(order_id).strip()
        if not order_id:
            raise PolicyViolationException("Valid order_id is required")

        # Verify order status before attempting capture
        order_details = await self.client.get_order(order_id=order_id)
        current_status = str(order_details.get("status", "")).upper()

        # In live sandbox, order must be APPROVED before capture can succeed
        if current_status == "COMPLETED":
            return {
                "status": "COMPLETED",
                "order_id": order_id,
                "capture_id": f"stub-capture-{order_id}",
                "message": f"Order {order_id} has already been captured and completed.",
                "already_completed": True,
            }

        req_id = f"t9-pay-{order_id}"
        res = await self.client.capture_order(order_id=order_id, paypal_request_id=req_id)

        if db is not None:
            await append_ledger(
                db,
                event_type="T9_AGENT_ORDER_CAPTURED",
                payload={
                    "client_id": str(client_id),
                    "order_id": order_id,
                    "capture_id": res.get("capture_id"),
                    "status": res.get("status"),
                },
            )

        return res

    async def get_order(self, *, order_id: str) -> dict[str, Any]:
        """T9 Agent get_order: read current status and amounts."""
        order_id = str(order_id).strip()
        if not order_id:
            raise PolicyViolationException("Valid order_id is required")
        return await self.client.get_order(order_id=order_id)

    async def refund_order(
        self,
        *,
        capture_id: str,
        amount: Decimal | None = None,
        reason: str | None = None,
        staff_id: UUID | None = None,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """T2/T9 Refund helper: issues partial or full refund on a capture."""
        capture_id = str(capture_id).strip()
        if not capture_id:
            raise PolicyViolationException("Valid capture_id is required")

        if amount is not None and amount <= Decimal("0.00"):
            raise PolicyViolationException("Refund amount must be greater than zero")

        req_id = f"t9-refund-{capture_id}-{uuid.uuid4().hex[:8]}"
        res = await self.client.create_refund(
            capture_id=capture_id,
            amount=amount,
            note_to_payer=reason or "SalonDesk refund",
            paypal_request_id=req_id,
        )

        if db is not None:
            await append_ledger(
                db,
                event_type="T9_AGENT_REFUND_ISSUED",
                payload={
                    "staff_id": str(staff_id) if staff_id else None,
                    "capture_id": capture_id,
                    "refund_id": res.get("refund_id"),
                    "amount": str(amount) if amount else "full",
                    "reason": reason,
                },
                amount=amount,
            )

        return res

    async def create_refund(
        self,
        *,
        capture_id: str,
        amount: Decimal | None = None,
        reason: str | None = None,
        staff_id: UUID | None = None,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """T2/T9 Refund helper: issues partial or full refund on a capture."""
        return await self.refund_order(
            capture_id=capture_id,
            amount=amount,
            reason=reason,
            staff_id=staff_id,
            db=db,
        )

    async def list_disputes(
        self,
        *,
        page_size: int = 10,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """T9 Agent list_disputes: inspect sandbox/live PayPal disputes."""
        assert_tool_allowed("list_disputes")
        res = await self.client.list_disputes(page_size=page_size)
        if db is not None:
            await append_ledger(
                db,
                event_type="T9_AGENT_DISPUTE_INSPECTED",
                payload={
                    "action": "list_disputes",
                    "page_size": page_size,
                    "count": len(res.get("items", [])),
                },
            )
        return res

    async def get_dispute(
        self,
        *,
        dispute_id: str,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """T9 Agent get_dispute: inspect a specific PayPal dispute."""
        assert_tool_allowed("get_dispute")
        dispute_id_clean = str(dispute_id).strip()
        if not dispute_id_clean:
            raise PolicyViolationException("Valid dispute_id is required")
        res = await self.client.get_dispute(dispute_id=dispute_id_clean)
        if db is not None:
            await append_ledger(
                db,
                event_type="T9_AGENT_DISPUTE_INSPECTED",
                payload={
                    "action": "get_dispute",
                    "dispute_id": dispute_id_clean,
                    "status": res.get("status"),
                },
            )
        return res

    async def run(
        self,
        prompt: str,
        *,
        user: User | None = None,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """Parse natural language command into secure T9 agent actions."""
        prompt_clean = prompt.strip()
        if not prompt_clean:
            return {"status": "error", "message": "Empty prompt"}

        # Security check: client authentication
        if user is None:
            return {
                "status": "error",
                "message": "You must be signed in to execute PayPal checkout actions.",
            }

        lower = prompt_clean.lower()
        if any(w in lower for w in ("accept dispute", "accept claim", "concede dispute")):
            try:
                assert_tool_allowed("accept_dispute_claim")
            except PolicyViolationException as exc:
                return {"status": "error", "message": exc.message}

        # 1. Parse amount with safety regex
        amt_match = re.search(r"\$\s*(\d+(\.\d{1,2})?)", prompt_clean) or re.search(
            r"(\d+(\.\d{1,2})?)\s*(usd|dollars?)", prompt_clean, re.IGNORECASE
        )
        amount: Decimal | None = None
        if amt_match:
            try:
                amount = Decimal(amt_match.group(1))
            except (InvalidOperation, TypeError):
                amount = None

        # 2. Check for pay / capture intent on existing order
        order_match = re.search(r"\b([0-9A-Z]{17}|STUB-CAP-[a-f0-9]+)\b", prompt_clean)
        lower = prompt_clean.lower()

        if any(w in lower for w in ("pay", "capture", "complete")) and order_match:
            order_id = order_match.group(1)
            try:
                result = await self.pay_order(order_id=order_id, client_id=user.id, db=db)
                return {
                    "status": "success",
                    "action": "pay_order",
                    "order_id": order_id,
                    "capture_id": result.get("capture_id"),
                    "message": f"Order {order_id} has been captured and completed.",
                    "data": result,
                }
            except SalonDeskError as exc:
                return {"status": "error", "message": exc.message}

        # 3. Check for order status query
        if (
            any(w in lower for w in ("get order", "check order", "order status", "view order"))
            and order_match
        ):
            order_id = order_match.group(1)
            try:
                order_data = await self.get_order(order_id=order_id)
                st = order_data.get("status", "UNKNOWN")
                return {
                    "status": "success",
                    "action": "get_order",
                    "order_id": order_id,
                    "order_status": st,
                    "message": f"Order {order_id} status is {st}.",
                    "data": order_data,
                }
            except SalonDeskError as exc:
                return {"status": "error", "message": exc.message}

        # 4. Check for create order intent
        if any(w in lower for w in ("create", "deposit", "checkout", "order", "charge")):
            if amount is None:
                amount = Decimal("10.00")  # Default safe salon deposit

            # Extract service name hint
            service_name = "Salon Service Deposit"
            for candidate in (
                "haircut",
                "manicure",
                "pedicure",
                "braids",
                "balayage",
                "blowout",
                "facial",
            ):
                if candidate in lower:
                    service_name = candidate.capitalize()
                    break

            try:
                result = await self.create_order(
                    amount=amount,
                    service_name=service_name,
                    client_id=user.id,
                    currency="USD",
                    db=db,
                )
                return {
                    "status": "success",
                    "action": "create_order",
                    "order_id": result.get("order_id"),
                    "amount": str(amount),
                    "approval_url": result.get("approval_url"),
                    "message": (
                        f"Created PayPal order {result.get('order_id')} for ${amount:.2f} ({service_name}). "
                        f"Please approve payment: {result.get('approval_url')}"
                    ),
                    "data": result,
                }
            except SalonDeskError as exc:
                return {"status": "error", "message": exc.message}

        return {
            "status": "error",
            "message": "Could not identify a supported PayPal agent action (create_order, pay_order, get_order).",
        }
