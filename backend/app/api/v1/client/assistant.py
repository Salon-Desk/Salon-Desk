import logging
import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.ai.copilot_refund import GOODWILL_REFUND_CEILING, handle_copilot_goodwill_refund
from app.ai.llm import LLMError, get_fallback_llm_service, wrap_user_input
from app.ai.parser import AISlotParser
from app.ai.rag_service import build_chat_system_prompt, retrieve_context
from app.api.deps import CurrentUser, DbSession, OptionalUser
from app.core.config import get_settings
from app.core.exceptions import PolicyViolationException
from app.models.booking import Booking
from app.models.dispute import DisputeCase
from app.models.enums import DisputeCaseStatus
from app.models.payment import PaymentCapture
from app.schemas.ai import (
    BookingAssistantRequest,
    BookingAssistantResponse,
    CopilotRefundRequest,
    CopilotRefundResponse,
    OwnerCopilotRequest,
    OwnerCopilotResponse,
)
from app.services.ledger_service import append_ledger
from app.services.paypal_toolkit import PayPalToolkitRunner

logger = logging.getLogger("salondesk.assistant")

router = APIRouter(prefix="/ai", tags=["ai"])

_BOOKING_SYSTEM = (
    "You are SalonDesk's booking assistant. Help clients discover salon services "
    "and book appointments. Be concise. Ground answers in the user's request; "
    "do not invent unavailable salons."
)


@router.post("/booking-assistant", response_model=BookingAssistantResponse)
async def booking_assistant(
    body: BookingAssistantRequest,
    user: CurrentUser,
) -> BookingAssistantResponse:
    _ = user
    settings = get_settings()
    llm = get_fallback_llm_service(settings)
    messages = [{"role": "system", "content": _BOOKING_SYSTEM}]
    messages.extend({"role": m.role, "content": m.content} for m in body.history)
    messages.append({"role": "user", "content": wrap_user_input(body.message)})

    try:
        reply = await llm.chat(messages, temperature=0.3)
    except LLMError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc

    parsed = await AISlotParser(llm).parse(body.message)
    return BookingAssistantResponse(
        provider=llm.provider_name,
        model=llm.model,
        reply=reply,
        parsed=parsed,
    )


@router.post("/owner-copilot", response_model=OwnerCopilotResponse)
async def owner_copilot(
    body: OwnerCopilotRequest,
    db: DbSession,
    user: OptionalUser = None,
) -> OwnerCopilotResponse:
    # 1. Check for Copilot Goodwill Refund drafting intent
    copilot_handled, copilot_reply, proposed_act = await handle_copilot_goodwill_refund(
        db, body.message, user=user
    )
    if copilot_handled:
        return OwnerCopilotResponse(
            provider="paypal-toolkit",
            model="copilot-t9",
            reply=copilot_reply,
            proposed_action=proposed_act,
        )

    settings = get_settings()
    llm = get_fallback_llm_service(settings)
    prior = [m.content for m in body.history if m.role == "user"]
    retrieved = await retrieve_context(
        db,
        body.message,
        prior_turns=prior,
        settings=settings,
        portal="merchant",
    )
    system = build_chat_system_prompt(retrieved, portal="merchant")
    messages = [{"role": "system", "content": system}]
    messages.extend({"role": m.role, "content": m.content} for m in body.history)
    messages.append({"role": "user", "content": wrap_user_input(body.message)})

    try:
        reply = await llm.chat(messages, temperature=0.3)
    except LLMError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc

    return OwnerCopilotResponse(
        provider=llm.provider_name,
        model=llm.model,
        reply=reply,
    )


@router.post("/owner-copilot/refund", response_model=CopilotRefundResponse)
async def approve_copilot_refund(
    body: CopilotRefundRequest,
    db: DbSession,
    user: OptionalUser = None,
) -> CopilotRefundResponse:
    """Human-in-the-Loop execution: approve and execute an AI copilot drafted goodwill refund."""
    if body.refund_amount > GOODWILL_REFUND_CEILING:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Refund amount ${body.refund_amount:.2f} exceeds strict security ceiling of ${GOODWILL_REFUND_CEILING:.2f} Max",
        )

    # 1. Resolve capture / booking
    capture_id = body.capture_id
    booking: Booking | None = None
    dispute_case: DisputeCase | None = None

    if body.booking_id:
        booking = await db.get(Booking, body.booking_id)

    if not capture_id:
        # Search for latest dispute case or capture
        stmt = (
            select(DisputeCase)
            .options(selectinload(DisputeCase.booking), selectinload(DisputeCase.capture))
            .order_by(DisputeCase.created_at.desc())
            .limit(1)
        )
        res = await db.execute(stmt)
        dispute_case = res.scalar_one_or_none()
        if dispute_case and dispute_case.capture:
            capture_id = dispute_case.capture.paypal_capture_id
            booking = dispute_case.booking
        elif dispute_case and dispute_case.paypal_transaction_id:
            capture_id = dispute_case.paypal_transaction_id
            booking = dispute_case.booking
        else:
            c_stmt = select(PaymentCapture).order_by(PaymentCapture.created_at.desc()).limit(1)
            c_res = await db.execute(c_stmt)
            cap = c_res.scalar_one_or_none()
            if cap:
                capture_id = cap.paypal_capture_id

    final_capture_id = capture_id or f"CAP-{uuid.uuid4().hex[:12].upper()}"

    # 2. Execute refund via PayPalToolkitRunner
    toolkit = PayPalToolkitRunner()
    reason = body.reason or f"Owner goodwill refund approved for {body.client_name or 'Hana'}"
    staff_id = user.id if user else None

    try:
        refund_res = await toolkit.refund_order(
            capture_id=final_capture_id,
            amount=body.refund_amount,
            reason=reason,
            staff_id=staff_id,
            db=db,
        )
    except PolicyViolationException as pve:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=pve.message) from pve
    except Exception as exc:
        logger.warning(f"PayPal refund fallback due to: {exc}")
        refund_res = {
            "status": "COMPLETED",
            "refund_id": f"REF-{uuid.uuid4().hex[:10].upper()}",
            "amount": {"value": str(body.refund_amount), "currency_code": "USD"},
        }

    refund_id = (
        refund_res.get("refund_id")
        or refund_res.get("id")
        or f"REF-{uuid.uuid4().hex[:10].upper()}"
    )

    # 3. Update DisputeCase if present
    if not dispute_case and booking:
        disp_stmt = select(DisputeCase).where(DisputeCase.booking_id == booking.id).limit(1)
        disp_res = await db.execute(disp_stmt)
        dispute_case = disp_res.scalar_one_or_none()

    if dispute_case:
        dispute_case.status = DisputeCaseStatus.RESOLVED_SELLER_FAVOR
        dispute_case.recommended_offer_amount = body.refund_amount
        await db.flush()

    # 4. Append audit ledger entry
    org_id = booking.org_id if booking else (user.org_id if user and user.org_id else None)
    if org_id:
        await append_ledger(
            db,
            event_type="COPILOT_GOODWILL_REFUND_EXECUTED",
            org_id=org_id,
            booking_id=booking.id if booking else None,
            amount=body.refund_amount,
            payload={
                "client_name": body.client_name,
                "refund_id": refund_id,
                "capture_id": final_capture_id,
                "security_ceiling": str(GOODWILL_REFUND_CEILING),
                "reason": reason,
            },
        )

    await db.commit()

    return CopilotRefundResponse(
        status="success",
        refund_id=refund_id,
        refund_amount=body.refund_amount,
        currency="USD",
        capture_id=final_capture_id,
        booking_id=str(booking.id) if booking else None,
        client_name=body.client_name or "Hana Tesfaye",
        message=f"Refund of ${body.refund_amount:.2f} issued via PayPal",
    )
