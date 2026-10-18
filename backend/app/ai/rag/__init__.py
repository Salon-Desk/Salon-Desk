"""RAG service modules for semantic search and recommendations."""

from .constants import (
    ADMIN_GREETING_REPLY,
    ADMIN_PERSONA,
    CHAT_GREETING_REPLY,
    CHAT_PERSONA,
    DEFAULT_RECOMMENDATION_LIMIT,
    EXPANDED_RECOMMENDATION_LIMIT,
    MERCHANT_GREETING_REPLY,
    MERCHANT_PERSONA,
    OrganizationRecommendation,
    RetrievedChunk,
    RetrievedContext,
    ServiceRecommendation,
    greeting_reply_for_portal,
    persona_for_portal,
)
from .detection import detect_intent, detect_language
from .formatting import (
    build_chat_system_prompt,
    build_voice_rag_instruction,
    format_context_text,
)
from .hydration import (
    fill_recommendations_from_organizations,
    hydrate_organization_recommendations,
    hydrate_service_recommendations,
    search_nearby_services,
    search_services_by_keywords,
)
from .recommendations import (
    recommendation_limit_for,
    select_recommendations,
    wants_more_recommendations,
)
from .search import search_chunks
from .utils import build_search_query, haversine_km

__all__ = [
    "ADMIN_GREETING_REPLY",
    "ADMIN_PERSONA",
    "CHAT_GREETING_REPLY",
    "CHAT_PERSONA",
    "DEFAULT_RECOMMENDATION_LIMIT",
    "EXPANDED_RECOMMENDATION_LIMIT",
    "MERCHANT_GREETING_REPLY",
    "MERCHANT_PERSONA",
    "OrganizationRecommendation",
    "RetrievedChunk",
    "RetrievedContext",
    "ServiceRecommendation",
    "detect_language",
    "detect_intent",
    "build_voice_rag_instruction",
    "build_chat_system_prompt",
    "format_context_text",
    "greeting_reply_for_portal",
    "haversine_km",
    "build_search_query",
    "persona_for_portal",
    "select_recommendations",
    "wants_more_recommendations",
    "recommendation_limit_for",
    "search_chunks",
    "hydrate_service_recommendations",
    "hydrate_organization_recommendations",
    "search_nearby_services",
    "search_services_by_keywords",
    "fill_recommendations_from_organizations",
]
