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
    "org",
    "organization",
    "organizations",
    "shop",
    "shops",
    "parlor",
    "barbershop",
    "barber shop",
    "spa",
    "spas",
)

_SPECIFIC_SERVICE_HINTS = (
    "haircut",
    "hair cut",
    "fade",
    "braid",
    "braids",
    "manicure",
    "pedicure",
    "facial",
    "massage",
    "beard",
    "balayage",
    "locs",
    "twist",
    "blowout",
    "waxing",
)

_SERVICE_REQUEST_HINTS = _SPECIFIC_SERVICE_HINTS + (
    "service",
    "services",
    "treatment",
    "treatments",
    "menu",
    "cut",
    "color",
    "book",
    "booking",
    "reserve",
    "slot",
    "appointment",
    "schedule",
    "cost",
    "costs",
    "price",
    "prices",
    "pricing",
    "offer",
    "offers",
    "offering",
    "offerings",
    "options",
    "show more",
    "more options",
)

# Persona and instructions
CHAT_GREETING_REPLY = "Hey! What are you hoping to book — a cut, color, or just looking around?"

MERCHANT_GREETING_REPLY = (
    "Hi — merchant help here. I can walk you through staff, services, settlements, "
    "PayPal, policies, and how platform commissions and invoices work. What do you want to do?"
)

ADMIN_GREETING_REPLY = (
    "Hi — admin help here. I can walk you through salon approvals, change requests, "
    "commission rules and SaaS billing, taxonomy, or platform staff. What do you want to do?"
)

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

MERCHANT_PERSONA = """
You are SalonDesk's merchant help-center assistant for the Organization Portal.

How you talk:
- Sound like a helpful teammate. Short sentences. Contractions are fine.
- For how-to questions, give clear numbered steps with sidebar page + button names
  (Staff, Services, Appointments, Calendar, Settings → PayPal / Policies).
- Always cover money correctly when asked: client captures settle 100% to the org PayPal;
  SalonDesk SaaS commission accrues on capture and is billed later via invoice — not deducted
  from the client hold. Voided holds = zero commission.
- Cover every console scenario: register/onboarding, staff CRUD, services CRUD, calendar,
  mark show / no-show / void / reauthorize, PayPal & policy change requests, commissions/invoices.
- Do NOT book client appointments or act as the client concierge.
- Stay grounded in verified help context. Ask one clarifying question if the screen is unclear.
""".strip()

ADMIN_PERSONA = """
You are SalonDesk's platform admin help-center assistant.

How you talk:
- Sound like a helpful teammate. Short sentences. Contractions are fine.
- For how-to questions, give numbered steps with sidebar page + action
  (Salons, Approvals, Commission, Taxonomy, Staff).
- Explain commission rules (percentage/flat/hybrid), accrual on capture, and SaaS invoices
  (ISSUED/PAID/OVERDUE) including suspending orgs for overdue platform billing when relevant.
- Cover approve/suspend salons, PayPal & policy change requests, taxonomy, invite platform staff.
- Do NOT book client appointments.
- Stay grounded in verified help context. Ask one clarifying question if needed.
""".strip()


def greeting_reply_for_portal(portal: str | None) -> str:
    if portal == "merchant":
        return MERCHANT_GREETING_REPLY
    if portal == "admin":
        return ADMIN_GREETING_REPLY
    return CHAT_GREETING_REPLY


def persona_for_portal(portal: str | None) -> str:
    if portal == "merchant":
        return MERCHANT_PERSONA
    if portal == "admin":
        return ADMIN_PERSONA
    return CHAT_PERSONA


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
    working_hours: dict | None = None
    timezone: str | None = None


@dataclass
class StylistRecommendation:
    """Interactive stylist / staff card payload for chat UI."""

    id: str
    name: str
    organization_id: UUID | None = None
    organization_name: str | None = None
    role: str = "Stylist"
    picture: str | None = None
    bio: str | None = None
    rating: float | None = None
    is_any: bool = False


@dataclass
class RetrievedContext:
    chunks: list[RetrievedChunk] = field(default_factory=list)
    recommendations: list[ServiceRecommendation] = field(default_factory=list)
    organizations: list[OrganizationRecommendation] = field(default_factory=list)
    stylists: list[StylistRecommendation] = field(default_factory=list)
    context_text: str = ""
    detected_language: str = "en"
    is_greeting: bool = False
    intent: str = "discover"  # discover | booking | farewell | greeting
