from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser
from app.core.config import get_settings
from app.schemas.ai import (
    BookingAssistantRequest,
    BookingAssistantResponse,
    OwnerCopilotRequest,
    OwnerCopilotResponse,
)
from app.services.ai_parser import AISlotParser
from app.services.llm import LLMError, get_llm_service

router = APIRouter(prefix="/ai", tags=["ai"])

_BOOKING_SYSTEM = (
    "You are SalonDesk's booking assistant. Help clients discover salon services "
    "and book appointments. Be concise. Ground answers in the user's request; "
    "do not invent unavailable salons."
)

_OWNER_SYSTEM = (
    "You are SalonDesk's organization copilot. Help salon owners with scheduling, "
    "services, and operations. Be concise and practical."
)


@router.post("/booking-assistant", response_model=BookingAssistantResponse)
async def booking_assistant(
    body: BookingAssistantRequest,
    user: CurrentUser,
) -> BookingAssistantResponse:
    _ = user
    settings = get_settings()
    llm = get_llm_service(settings)
    messages = [{"role": "system", "content": _BOOKING_SYSTEM}]
    messages.extend({"role": m.role, "content": m.content} for m in body.history)
    messages.append({"role": "user", "content": body.message})

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
    user: CurrentUser,
) -> OwnerCopilotResponse:
    _ = user
    settings = get_settings()
    llm = get_llm_service(settings)
    messages = [{"role": "system", "content": _OWNER_SYSTEM}]
    messages.extend({"role": m.role, "content": m.content} for m in body.history)
    messages.append({"role": "user", "content": body.message})

    try:
        reply = await llm.chat(messages, temperature=0.3)
    except LLMError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc

    return OwnerCopilotResponse(
        provider=llm.provider_name,
        model=llm.model,
        reply=reply,
    )
