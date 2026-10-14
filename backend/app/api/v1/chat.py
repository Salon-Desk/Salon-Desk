"""Client AI chat: semantic search + DB-grounded service recommendations."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.chat import (
    ChatCitation,
    ChatRequest,
    ChatResponse,
    ServiceCardOut,
)
from app.services.llm import LLMError, get_llm_service
from app.services.rag_service import build_chat_system_prompt, retrieve_context

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user: CurrentUser,
    db: DbSession,
) -> ChatResponse:
    _ = user
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

    llm = get_llm_service()
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
                base_price=r.base_price,
                duration_minutes=r.duration_minutes,
                category_name=r.category_name,
                description=r.description,
                physical_address=r.physical_address,
                score=r.score,
            )
            for r in retrieved.recommendations
        ],
    )
