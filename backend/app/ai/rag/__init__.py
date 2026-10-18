"""RAG service modules for semantic search and recommendations."""

from .constants import (
    CHAT_GREETING_REPLY,
    CHAT_PERSONA,
    DEFAULT_RECOMMENDATION_LIMIT,
    EXPANDED_RECOMMENDATION_LIMIT,
    OrganizationRecommendation,
    RetrievedChunk,
    RetrievedContext,
    ServiceRecommendation,
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
    "CHAT_GREETING_REPLY",
    "CHAT_PERSONA",
    "DEFAULT_RECOMMENDATION_LIMIT",
    "EXPANDED_RECOMMENDATION_LIMIT",
    "OrganizationRecommendation",
    "RetrievedChunk",
    "RetrievedContext",
    "ServiceRecommendation",
    "detect_language",
    "detect_intent",
    "build_voice_rag_instruction",
    "build_chat_system_prompt",
    "format_context_text",
    "haversine_km",
    "build_search_query",
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
