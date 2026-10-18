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
    if nav or ui_act:
        act_label = ui_act.label if ui_act else (nav.label if nav else "")
        target_path = ui_act.target if ui_act and ui_act.target else (nav.target if nav else "")
        action_note = (
            f"\n\n[Active Screen Action: The console interface is autonomously opening/navigating "
            f"to {act_label} ({target_path}). Naturally acknowledge and confirm this action to the "
            f"user in 1–2 friendly, spoken sentences.]"
        )
        system = f"{system}{action_note}"

    messages = [{"role": "system", "content": system}]
    messages.extend({"role": m.role, "content": m.content} for m in body.history)
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
