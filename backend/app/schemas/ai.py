from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    content: str


class ProposedAction(BaseModel):
    action_type: str
    confidence: float = Field(ge=0, le=1)
    payload: dict[str, Any] = Field(default_factory=dict)


class SlotParseResult(BaseModel):
    service_hint: str | None = None
    starts_at: datetime | None = None
    stylist_hint: str | None = None
    notes: str | None = None
    confidence: float = Field(ge=0, le=1, default=0.0)


class BookingAssistantRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)


class BookingAssistantResponse(BaseModel):
    provider: str
    model: str
    reply: str
    parsed: SlotParseResult | None = None


class OwnerCopilotRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)


class OwnerCopilotResponse(BaseModel):
    provider: str
    model: str
    reply: str
