from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.ai import ChatMessage


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    language: str | None = Field(default=None, description="en | am")
    org_id: UUID | None = Field(default=None, description="Optional org scope for semantic search")


class ChatCitation(BaseModel):
    entity_type: str
    entity_id: UUID | None = None
    title: str
    content: str


class ServiceCardOut(BaseModel):
    """Interactive recommendation card for chat UI (PRD §2.3.3.D)."""

    service_id: UUID
    organization_id: UUID
    name: str
    organization_name: str
    base_price: Decimal
    duration_minutes: int
    category_name: str | None = None
    description: str | None = None
    physical_address: str | None = None
    score: float = 0.0


class ChatResponse(BaseModel):
    reply: str
    provider: str
    model: str
    detected_language: str
    intent: str
    citations: list[ChatCitation] = Field(default_factory=list)
    recommendations: list[ServiceCardOut] = Field(default_factory=list)


class LiveKitTokenRequest(BaseModel):
    language: str = Field(default="en", pattern="^(en|am)$")
    participant_name: str | None = None
    metadata: str | None = None


class LiveKitTokenResponse(BaseModel):
    token: str
    server_url: str
    room_name: str
