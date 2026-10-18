"""Language and intent detection for RAG service."""

from .constants import _AMHARIC_RE, _GREETING_RE


def detect_language(message: str) -> str:
    """Detect if message is in Amharic or English."""
    if _AMHARIC_RE.search(message or ""):
        return "am"
    return "en"


def _is_greeting(message: str) -> bool:
    """Check if message is a greeting."""
    return bool(_GREETING_RE.match(message or ""))


def detect_intent(message: str) -> str:
    """Detect user intent from message."""
    lowered = (message or "").lower()

    if any(h in lowered for h in ("bye", "goodbye", "good bye", "see you", "hang up", "end call")):
        return "farewell"

    if _is_greeting(message) and len(lowered.split()) <= 3:
        return "greeting"

    if any(
        h in lowered
        for h in (
            "book",
            "booking",
            "appointment",
            "schedule",
            "available",
            "availability",
            "reserve",
            "slot",
            "when can",
        )
    ):
        return "booking"

    return "discover"
