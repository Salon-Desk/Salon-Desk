"""Client AI chat: semantic search + DB-grounded service recommendations."""

from fastapi import APIRouter, HTTPException, status

from app.ai.chat_auth import try_handle_chat_auth
from app.ai.chat_booking import try_handle_chat_booking
from app.ai.llm import LLMError, get_llm_service
from app.ai.rag_service import build_chat_system_prompt, retrieve_context
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

    # 1. Try conversational authentication (login / signup)
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

    # 2. Try conversational booking / hold confirmation
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

    # 3. Discovery & RAG Context
    prior = [m.content for m in body.history if m.role == "user"]
    retrieved = await retrieve_context(
        db,
        body.message,
        room_language=body.language,
        prior_turns=prior,
        org_id=body.org_id,
    )
    system = build_chat_system_prompt(retrieved)
    messages = [{"role": "system", "content": system}]
    messages.extend({"role": m.role, "content": m.content} for m in body.history)
    messages.append({"role": "user", "content": body.message})

    try:
        reply = await llm.chat(messages, temperature=0.3)
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
    )
