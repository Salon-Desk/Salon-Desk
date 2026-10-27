"""AI chat: client booking concierge, or merchant/admin system help."""

import re

from fastapi import APIRouter, HTTPException, Request, status

from app.ai.chat_agent import run_chat_agent
from app.ai.chat_auth import try_handle_chat_auth
from app.ai.chat_booking import try_handle_chat_booking
from app.ai.chat_context import compress_conversation_history
from app.ai.chat_responses import (
    chat_response,
    retrieved_chat_response,
    with_client_booking_context,
)
from app.ai.llm import LLMError, get_fallback_llm_service, wrap_user_input
from app.ai.portal import is_support_portal, normalize_portal
from app.ai.rag_service import (
    build_chat_system_prompt,
    greeting_reply_for_portal,
    retrieve_context,
)
from app.ai.support_actions import resolve_portal_navigation
from app.api.deps import DbSession, OptionalUser
from app.core.config import get_settings
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


def _trusted_origin(request: Request) -> str | None:
    origin = (request.headers.get("origin") or "").rstrip("/")
    if not origin:
        return None
    settings = get_settings()
    if origin in settings.cors_origins:
        return origin
    if settings.cors_origin_regex and re.fullmatch(settings.cors_origin_regex, origin):
        return origin
    return None


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: DbSession,
    request: Request,
    user: OptionalUser = None,
) -> ChatResponse:
    llm = get_fallback_llm_service()
    portal = normalize_portal(body.portal)
    language = body.language or "en"

    # Booking auth / hold confirmation only for the client concierge
    if not is_support_portal(portal):
        auth_res = await try_handle_chat_auth(db, llm, body.message, body.history)
        auth_handled = auth_res[0]
        auth_reply = auth_res[1]
        auth_token = auth_res[2]
        user_info = auth_res[3]
        auth_ui_action = auth_res[4] if len(auth_res) > 4 else None
        if auth_handled:
            return chat_response(
                llm,
                reply=auth_reply,
                detected_language=language,
                intent="auth",
                auth_token=auth_token,
                user=user_info,
                ui_action=auth_ui_action,
            )

        booking_handled, booking_reply, confirmed_info = await try_handle_chat_booking(
            db,
            llm,
            body.message,
            body.history,
            user=user,
            frontend_base=_trusted_origin(request),
        )
        if booking_handled:
            auth_token = confirmed_info.pop("auth_token", None) if confirmed_info else None
            user_info = confirmed_info.pop("user", None) if confirmed_info else None
            booking_ui_act_dict = confirmed_info.pop("ui_action", None) if confirmed_info else None
            needs_auth = confirmed_info.pop("needs_auth", False) if confirmed_info else False
            needs_stylist = confirmed_info.pop("needs_stylist", False) if confirmed_info else False
            needs_time = confirmed_info.pop("needs_time", False) if confirmed_info else False
            stylists = confirmed_info.pop("stylists", None) if confirmed_info else None
            raw_recs = confirmed_info.pop("recommendations", None) if confirmed_info else None

            from app.schemas.chat import ServiceCardOut

            rec_cards: list[ServiceCardOut] = []
            if raw_recs:
                for r in raw_recs:
                    if isinstance(r, ServiceCardOut):
                        rec_cards.append(r)
                    elif isinstance(r, dict):
                        rec_cards.append(ServiceCardOut(**r))

            ui_act = None
            if booking_ui_act_dict:
                from app.ai.support_actions import AgentUiAction

                ui_act = AgentUiAction(**booking_ui_act_dict)

            return chat_response(
                llm,
                reply=booking_reply,
                detected_language=language,
                intent="booking",
                confirmed_booking=(
                    confirmed_info
                    if confirmed_info
                    and not needs_auth
                    and not needs_stylist
                    and not needs_time
                    and not raw_recs
                    else None
                ),
                payment_link=confirmed_info.get("payment_link") if confirmed_info else None,
                auth_token=auth_token,
                user=user_info,
                ui_action=ui_act,
                stylists=stylists,
                recommendations=rec_cards,
            )

        from app.ai.tools.paypal_tools import handle_paypal_agent_chat

        t9_handled, t9_reply, t9_meta = await handle_paypal_agent_chat(db, body.message, user=user)
        if t9_handled:
            return chat_response(
                llm,
                reply=t9_reply,
                detected_language=language,
                intent="paypal_checkout",
                payment_link=t9_meta.get("approval_url") if t9_meta else None,
                confirmed_booking=t9_meta,
            )

    prior = [turn.content for turn in body.history if turn.role == "user"]
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
        return chat_response(
            llm,
            reply=greeting_reply_for_portal(portal),
            detected_language=retrieved.detected_language,
            intent=retrieved.intent,
        )

    navigation, ui_action = resolve_portal_navigation(portal, body.message)
    system = build_chat_system_prompt(retrieved, portal=portal)
    if not is_support_portal(portal):
        system, navigation = await with_client_booking_context(
            db, user, body.message, system, navigation
        )

    if navigation or ui_action:
        act_label = ui_action.label if ui_action else (navigation.label if navigation else "")
        target_path = (
            ui_action.target
            if ui_action and ui_action.target
            else (navigation.target if navigation else "")
        )
        system = (
            f"{system}\n\n[Active Screen Action: The console interface is autonomously "
            f"opening/navigating to {act_label} ({target_path}). Naturally acknowledge and "
            f"confirm this action to the user in 1–2 friendly, spoken sentences.]"
        )

    messages = [{"role": "system", "content": system}]
    messages.extend(compress_conversation_history(body.history))
    messages.append({"role": "user", "content": wrap_user_input(body.message)})

    try:
        # Support how-tos need a bit more room for numbered steps.
        max_tokens = 360 if is_support_portal(portal) else 260
        if not is_support_portal(portal):
            reply, extra_recs, extra_orgs = await run_chat_agent(
                llm,
                messages,
                db=db,
                user_lat=body.user_lat,
                user_lng=body.user_lng,
                max_tokens=max_tokens,
                temperature=0.55,
            )
            if extra_recs:
                retrieved.recommendations = extra_recs
            if extra_orgs:
                retrieved.organizations = extra_orgs
        else:
            reply = await llm.chat(messages, temperature=0.55, max_tokens=max_tokens)
    except LLMError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc

    return retrieved_chat_response(
        llm,
        reply=reply,
        retrieved=retrieved,
        navigation=navigation,
        ui_action=ui_action,
    )
