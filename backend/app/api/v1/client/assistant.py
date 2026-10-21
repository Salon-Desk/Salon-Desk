from fastapi import APIRouter, HTTPException, status

from app.ai.llm import LLMError, get_fallback_llm_service, wrap_user_input
from app.ai.parser import AISlotParser
from app.ai.rag_service import build_chat_system_prompt, retrieve_context
from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.schemas.ai import (
    BookingAssistantRequest,
    BookingAssistantResponse,
    OwnerCopilotRequest,
    OwnerCopilotResponse,
)

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
    user: CurrentUser,
) -> OwnerCopilotResponse:
    _ = user
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
