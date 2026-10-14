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
