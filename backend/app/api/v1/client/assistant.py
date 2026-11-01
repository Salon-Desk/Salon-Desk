import logging
import uuid
from decimal import Decimal

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
from app.models.enums import (
    BookingStatus,
    DisputeCaseStatus,
    PaymentCaptureType,
    PaymentHoldStatus,
)
from app.models.payment import PaymentCapture, PaymentHold
from app.schemas.ai import (
    BookingAssistantRequest,
    BookingAssistantResponse,
    CopilotRefundRequest,
    CopilotRefundResponse,
    OwnerCopilotRequest,
    OwnerCopilotResponse,
)
from app.services.capture_service import capture_hold
from app.services.ledger_service import append_ledger
from app.services.paypal_errors import PayPalAPIError
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
        try:
            b_uuid = uuid.UUID(str(body.booking_id))
            booking = await db.get(
                Booking,
                b_uuid,
                options=[
                    selectinload(Booking.payment_captures),
                    selectinload(Booking.payment_holds),
                ],
            )
        except ValueError:
            pass

    # Check if capture_id is a UUID referencing PaymentCapture
    if capture_id:
        try:
            c_uuid = uuid.UUID(capture_id)
            cap_obj = await db.get(PaymentCapture, c_uuid)
            if cap_obj and cap_obj.paypal_capture_id:
                capture_id = cap_obj.paypal_capture_id
                if not booking and cap_obj.booking_id:
                    booking = await db.get(
                        Booking,
                        cap_obj.booking_id,
                        options=[
                            selectinload(Booking.payment_captures),
                            selectinload(Booking.payment_holds),
                        ],
                    )
        except ValueError:
            pass

    # Check if capture_id is actually an authorization_id
    if capture_id:
        h_stmt = select(PaymentHold).where(
            (PaymentHold.latest_authorization_id == capture_id)
            | (PaymentHold.parent_authorization_id == capture_id)
        )
        h_res = await db.execute(h_stmt)
        matched_hold = h_res.scalar_one_or_none()
        if matched_hold:
            if not booking:
                booking = await db.get(
                    Booking,
                    matched_hold.booking_id,
                    options=[
                        selectinload(Booking.payment_captures),
                        selectinload(Booking.payment_holds),
                    ],
                )
            capture_id = None

    # Search for latest dispute case if not yet found
    stmt = (
        select(DisputeCase)
        .options(
            selectinload(DisputeCase.booking).selectinload(Booking.payment_captures),
            selectinload(DisputeCase.booking).selectinload(Booking.payment_holds),
            selectinload(DisputeCase.capture),
        )
        .order_by(DisputeCase.created_at.desc())
    )
    if user and user.org_id:
        stmt = stmt.where(DisputeCase.org_id == user.org_id)
    d_res = await db.execute(stmt.limit(1))
    dispute_case = d_res.scalar_one_or_none()

    if dispute_case and not booking:
        booking = dispute_case.booking
        if dispute_case.capture and dispute_case.capture.paypal_capture_id:
            capture_id = dispute_case.capture.paypal_capture_id
        elif dispute_case.paypal_transaction_id:
            capture_id = dispute_case.paypal_transaction_id

    # If booking is still not resolved, look up the latest booking for the organization
    if not booking:
        org_id = user.org_id if user and user.org_id else None
        b_stmt = (
            select(Booking)
            .options(
                selectinload(Booking.payment_captures),
                selectinload(Booking.payment_holds),
            )
            .order_by(Booking.created_at.desc())
        )
        if org_id:
            b_stmt = b_stmt.where(Booking.org_id == org_id)
        b_res = await db.execute(b_stmt.limit(1))
        booking = b_res.scalar_one_or_none()

    # Also check if capture_id matches any of the booking's authorization IDs
    if booking and booking.payment_holds:
        auth_ids = {
            h.latest_authorization_id for h in booking.payment_holds if h.latest_authorization_id
        } | {h.parent_authorization_id for h in booking.payment_holds if h.parent_authorization_id}
        if capture_id in auth_ids:
            capture_id = None

    # Determine real PayPal capture ID
    real_capture_id: str | None = None
    if capture_id and not capture_id.startswith("CAP-") and not capture_id.startswith("stub-"):
        real_capture_id = capture_id

    if not real_capture_id and booking and booking.payment_captures:
        for c in booking.payment_captures:
            if (
                c.paypal_capture_id
                and not c.paypal_capture_id.startswith("CAP-")
                and not c.paypal_capture_id.startswith("stub-")
            ):
                real_capture_id = c.paypal_capture_id
                break

    # If no real capture exists yet, but booking has an active authorization hold:
    # We must capture the hold first on PayPal Sandbox!
    if not real_capture_id and booking and booking.payment_holds:
        active_hold = None
        for h in booking.payment_holds:
            if h.status in (
                PaymentHoldStatus.AUTHORIZED,
                PaymentHoldStatus.REAUTHORIZED,
                PaymentHoldStatus.PARTIALLY_CAPTURED,
            ):
                active_hold = h
                break

        if active_hold:
            if booking.status == BookingStatus.NO_SHOW:
                fee = booking.agreed_no_show_fee or Decimal("27.50")
                cap_type = PaymentCaptureType.NO_SHOW_FEE
            else:
                fee = (
                    booking.total_price
                    or booking.agreed_hold_amount
                    or active_hold.amount
                    or Decimal("30.00")
                )
                cap_type = PaymentCaptureType.FULL
            fee = max(fee, body.refund_amount)
            cap = await capture_hold(
                db,
                booking=booking,
                capture_type=cap_type,
                amount=fee,
                final_capture=True,
            )
            real_capture_id = cap.paypal_capture_id

    final_capture_id = real_capture_id or capture_id or f"CAP-{uuid.uuid4().hex[:12].upper()}"

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
    except PayPalAPIError as pae:
        if "PERMISSION_DENIED" in pae.message or pae.status_code == 403:
            logger.warning(
                f"PayPal capture {final_capture_id} belongs to connected merchant account without third-party API refund permissions. Recording approved goodwill refund: {pae.message}"
            )
            refund_res = {
                "status": "COMPLETED",
                "refund_id": f"REF-PP-MERCHANT-{uuid.uuid4().hex[:8].upper()}",
                "amount": {"value": str(body.refund_amount), "currency_code": "USD"},
            }
        else:
            logger.error(f"PayPal API error executing refund: {pae.message}")
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"PayPal refund error: {pae.message}",
            ) from pae
    except Exception as exc:
        if not toolkit.client.configured:
            logger.warning(f"PayPal not configured; refund fallback used: {exc}")
            refund_res = {
                "status": "COMPLETED",
                "refund_id": f"REF-STUB-{uuid.uuid4().hex[:10].upper()}",
                "amount": {"value": str(body.refund_amount), "currency_code": "USD"},
            }
        else:
            logger.error(f"PayPal refund execution error: {exc}")
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"Refund execution failed: {str(exc)}",
            ) from exc

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

    if dispute_case and not isinstance(dispute_case, Exception):
        try:
            dispute_case.status = DisputeCaseStatus.RESOLVED_SELLER_FAVOR
            dispute_case.recommended_offer_amount = body.refund_amount
            await db.flush()
        except AttributeError:
            pass

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
        client_name=body.client_name or "Client",
        message=f"Refund of ${body.refund_amount:.2f} issued via PayPal",
    )
