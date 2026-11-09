"""Chat assistant package for SalonDesk (concierge, booking flow, auth, context)."""

from app.ai.chat_agent import ChatAgent
from app.ai.chat_auth import attempt_chat_auth
from app.ai.chat_booking import ChatBookingFlow
from app.ai.chat_context import build_conversation_context
from app.ai.chat_responses import ChatResponseBuilder

__all__ = [
    "ChatAgent",
    "ChatBookingFlow",
    "ChatResponseBuilder",
    "attempt_chat_auth",
    "build_conversation_context",
]
