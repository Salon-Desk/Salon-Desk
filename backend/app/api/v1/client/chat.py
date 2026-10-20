"""AI chat: client booking concierge, or merchant/admin system help."""

from fastapi import APIRouter, HTTPException, status

from app.ai.chat_auth import try_handle_chat_auth
from app.ai.chat_booking import try_handle_chat_booking
from app.ai.llm import LLMError, get_llm_service
from app.ai.portal import is_support_portal, normalize_portal
from app.ai.rag_service import (
    build_chat_system_prompt,
    greeting_reply_for_portal,
    retrieve_context,
)
from app.ai.support_actions import resolve_portal_navigation
from app.api.deps import DbSession, OptionalUser
from app.schemas.chat import (
    ChatCitation,
    ChatRequest,
    ChatResponse,
    OrganizationCardOut,
    ServiceCardOut,
)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: DbSession,
    user: OptionalUser = None,
) -> ChatResponse:
    llm = get_llm_service()
    portal = normalize_portal(body.portal)

    # Booking auth / hold confirmation only for the client concierge
    if not is_support_portal(portal):
        auth_handled, auth_reply, auth_token, user_info = await try_handle_chat_auth(
            db, llm, body.message, body.history
        )
        if auth_handled:
            return ChatResponse(
                reply=auth_reply,
                provider=llm.provider_name,
                model=llm.model,
                detected_language=body.language or "en",
                intent="auth",
                auth_token=auth_token,
                user=user_info,
            )

        booking_handled, booking_reply, confirmed_info = await try_handle_chat_booking(
            db, llm, body.message, body.history, user=user
        )
        if booking_handled:
            return ChatResponse(
                reply=booking_reply,
                provider=llm.provider_name,
                model=llm.model,
                detected_language=body.language or "en",
                intent="booking",
                confirmed_booking=confirmed_info,
            )

    prior = [m.content for m in body.history if m.role == "user"]
    retrieved = await retrieve_context(
        db,
        body.message,
        room_language=body.language,
        prior_turns=prior,
        org_id=body.org_id,
        user_lat=body.user_lat,
        user_lng=body.user_lng,
        portal=portal,
    )
    if retrieved.intent == "greeting" or retrieved.is_greeting:
        return ChatResponse(
            reply=greeting_reply_for_portal(portal),
            provider=llm.provider_name,
            model=llm.model,
            detected_language=retrieved.detected_language,
            intent=retrieved.intent,
        )

    nav, ui_act = resolve_portal_navigation(portal, body.message)
    system = build_chat_system_prompt(retrieved, portal=portal)

    # Client My Bookings & Cancellation Advisory
    if not is_support_portal(portal):
        lower_msg = body.message.lower()
        is_asking_booking = any(
            phrase in lower_msg
            for phrase in (
                "my booking",
                "my appointment",
                "my reservation",
                "cancel booking",
                "cancel appointment",
                "cancel my",
                "what did i book",
                "when is my",
                "cancellation status",
            )
        )
        if is_asking_booking:
            if user:
                from app.ai.support_actions import AgentNavigation
                from app.services import booking_service

                user_bookings = await booking_service.list_client_bookings(db, user.id)
                active_bookings = [
                    b
                    for b in user_bookings
                    if b.status.value in ("CONFIRMED", "PENDING", "REAUTHORIZED")
                ]
                if active_bookings:
                    booking_descriptions = []
                    for b in active_bookings[:3]:
                        svc_names = (
                            ", ".join(bs.service.name for bs in b.booking_services if bs.service)
                            or "Salon service"
                        )
                        deadline_str = (
                            b.free_cancel_deadline_at.strftime("%b %d at %I:%M %p")
                            if b.free_cancel_deadline_at
                            else "24h prior"
                        )
                        booking_descriptions.append(
                            f"- Booking #{str(b.id)[:8]}: {svc_names} at {b.organization.name if b.organization else 'Salon'} "
                            f"on {b.starts_at.strftime('%A, %b %d at %I:%M %p')}. "
                            f"Agreed hold: ${b.agreed_hold_amount}. "
                            f"Free cancel deadline: {deadline_str}. "
                            f"Late cancel penalty: ${b.agreed_late_cancel_fee}. Status: {b.status.value}."
                        )
                    bookings_text = "\n".join(booking_descriptions)
                    client_context_note = (
                        f"\n\n[Client's Live Bookings & Cancellation Information:\n{bookings_text}\n"
                        f"Gain/Loss Advisory: If the client cancels before the free cancel deadline, "
                        f"100% of the PayPal authorization hold is voided and released ($0 debited). "
                        f"If the client cancels late after the deadline, the salon may capture the agreed late cancellation fee. "
                        f"Direct them to open My Bookings to confirm or cancel their appointment.]"
                    )
                    system = f"{system}{client_context_note}"
                    nav = AgentNavigation(
                        target="/client/bookings",
                        label="View My Bookings & Cancel",
                        reason="Check booking details or manage cancellation",
                    )
                else:
                    client_context_note = (
                        "\n\n[Client Account Information: The client has no active appointments at this time. "
                        "Remind them they can browse services or book an appointment anytime.]"
                    )
                    system = f"{system}{client_context_note}"
            else:
                client_context_note = (
                    "\n\n[Client Account Note: The client is currently not signed in. "
                    "Prompt them to sign in or use the Sign In modal so you can look up their active bookings and cancellation details.]"
                )
                system = f"{system}{client_context_note}"

    if nav or ui_act:
        act_label = ui_act.label if ui_act else (nav.label if nav else "")
        target_path = ui_act.target if ui_act and ui_act.target else (nav.target if nav else "")
        action_note = (
            f"\n\n[Active Screen Action: The console interface is autonomously opening/navigating "
            f"to {act_label} ({target_path}). Naturally acknowledge and confirm this action to the "
            f"user in 1–2 friendly, spoken sentences.]"
        )
        system = f"{system}{action_note}"

    from app.ai.chat_context import compress_conversation_history

    messages = [{"role": "system", "content": system}]
    messages.extend(compress_conversation_history(body.history))
    messages.append({"role": "user", "content": body.message})

    try:
        # Support how-tos need a bit more room for numbered steps.
        max_tokens = 360 if is_support_portal(portal) else 220
        reply = await llm.chat(messages, temperature=0.55, max_tokens=max_tokens)
    except LLMError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc

    return ChatResponse(
        reply=reply,
        provider=llm.provider_name,
        model=llm.model,
        detected_language=retrieved.detected_language,
        intent=retrieved.intent,
        citations=[
            ChatCitation(
                entity_type=c.entity_type,
                entity_id=c.entity_id,
                title=c.title,
                content=c.content,
            )
            for c in retrieved.chunks
        ],
        recommendations=[
            ServiceCardOut(
                service_id=r.service_id,
                organization_id=r.organization_id,
                name=r.name,
                organization_name=r.organization_name,
                organization_picture=r.organization_picture,
                image_url=r.image_url,
                base_price=r.base_price,
                duration_minutes=r.duration_minutes,
                category_name=r.category_name,
                description=r.description,
                physical_address=r.physical_address,
                distance_km=r.distance_km,
                score=r.score,
            )
            for r in retrieved.recommendations
        ],
        organizations=[
            OrganizationCardOut(
                id=o.id,
                name=o.name,
                description=o.description,
                picture=o.picture,
                physical_address=o.physical_address,
                rating=o.rating,
                service_count=o.service_count,
                distance_km=o.distance_km,
            )
            for o in retrieved.organizations
        ],
        navigation=nav,
        ui_action=ui_act,
    )
