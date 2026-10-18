"""Constants for RAG service."""

import re
from dataclasses import dataclass, field
from decimal import Decimal
from uuid import UUID

# Regex patterns
_AMHARIC_RE = re.compile(r"[\u1200-\u137F]")
_GREETING_RE = re.compile(
    r"^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|selam)\b",
    re.I,
)
_NOISE_RE = re.compile(r"^(.)\1{6,}$")

# Recommendation limits
DEFAULT_RECOMMENDATION_LIMIT = 3
EXPANDED_RECOMMENDATION_LIMIT = 8

# Regex for "more recommendations" requests
_MORE_RECOMMENDATIONS_RE = re.compile(
    r"\b("
    r"more( options| salons| services| please)?"
    r"|other(s)?"
    r"|what else"
    r"|anything else"
    r"|show more"
    r"|see more"
    r"|few more"
    r"|another"
    r"|all (the )?options"
    r"|full list"
    r")\b",
    re.I,
)

# Stopwords for query tokenization
_QUERY_STOPWORDS = frozenset(
    {
        "searching",
        "search",
        "looking",
        "look",
        "want",
        "wanna",
        "need",
        "good",
        "best",
        "find",
        "finding",
        "please",
        "the",
        "for",
        "and",
        "you",
        "have",
        "any",
        "some",
        "near",
        "nearby",
        "around",
        "close",
        "just",
        "like",
        "get",
        "got",
        "can",
        "could",
        "would",
        "help",
        "hello",
        "hey",
        "salon",
        "salons",
        "salone",
        "place",
        "places",
        "studio",
    }
)

# Hint keywords for query classification
_SALON_HUNT_HINTS = (
    "salon",
    "salons",
    "salone",
    "studio",
    "place",
    "places",
    "nearby",
    "near me",
)

_SPECIFIC_SERVICE_HINTS = (
    "haircut",
    "cut",
    "color",
    "fade",
    "braid",
    "manicure",
    "pedicure",
    "facial",
    "massage",
    "spa",
    "beard",
    "balayage",
    "locs",
    "twist",
)

# Persona and instructions
CHAT_GREETING_REPLY = "Hey! What are you hoping to book — a cut, color, or just looking around?"

CHAT_PERSONA = """
You are a real person helping someone book a salon — warm, brief, and easy to talk to.

How you talk:
- Sound like a text to a friend who works the front desk. Short sentences. Contractions are fine.
- Usually 2–4 sentences. Never write an essay.
- Do not use markdown tables, headings, numbered "Next Steps", bullet lists, or service IDs.
- Do not say "based on verified data" or treat distance as a rating. Kilometers are how far they are.
- Cards in the app already show price, duration, and address. Mention one or two highlights in passing.
- Recommend at most 3 options unless they asked for more. Invite them to ask if they want others.
- Ask only one easy follow-up. Never interview them with a numbered checklist.
- If they only said hi, greet them and ask what they are after. Do not recap how booking works.
- Stay grounded in the verified services below. Never invent salons, prices, or open slots.
- If they need to sign in to book, mention it casually and keep their pick.
""".strip()


# Data classes
@dataclass
class RetrievedChunk:
    entity_type: str
    entity_id: UUID | None
    org_id: UUID | None
    title: str
    content: str
    score: float = 0.0
    metadata: dict = field(default_factory=dict)


@dataclass
class ServiceRecommendation:
    """Interactive service card payload for chat UI / voice summary."""

    service_id: UUID
    organization_id: UUID
    name: str
    organization_name: str
    base_price: Decimal
    duration_minutes: int
    category_name: str | None = None
    description: str | None = None
    physical_address: str | None = None
    distance_km: float | None = None
    organization_picture: str | None = None
    image_url: str | None = None
    score: float = 0.0


@dataclass
class OrganizationRecommendation:
    """Interactive organization / salon card payload for chat UI."""

    id: UUID
    name: str
    description: str | None = None
    picture: str | None = None
    physical_address: str | None = None
    rating: float = 4.9
    service_count: int = 0
    distance_km: float | None = None


@dataclass
class RetrievedContext:
    chunks: list[RetrievedChunk] = field(default_factory=list)
    recommendations: list[ServiceRecommendation] = field(default_factory=list)
    organizations: list[OrganizationRecommendation] = field(default_factory=list)
    context_text: str = ""
    detected_language: str = "en"
    is_greeting: bool = False
    intent: str = "discover"  # discover | booking | farewell | greeting
