"""Spoken-style prompts for the SalonDesk voice booking agent (PRD §2.3.3)."""

from __future__ import annotations

import re

GREETING_EN = (
    "Hi, I'm the SalonDesk assistant. I can help you find salon services "
    "or book an appointment. What are you looking for today?"
)

GREETING_AM = "ሰላም፣ እኔ የ SalonDesk ረዳት ነኝ። አገልግሎት ለመፈለግ ወይም ቀጠሮ ለመያዝ መርዳት እችላለሁ። ምን ይፈልጋሉ?"

INSTRUCTIONS_EN = """
You are SalonDesk's realtime voice assistant for beauty salon discovery and booking.

Goals (in order):
1) Understand what service / salon / budget / time the client wants.
2) Recommend only verified services from tools or injected context.
3) Guide toward picking a service and appointment time.
4) Seamless Voice Authentication:
- If the user asks to log in or sign in, ask for their email address and password. Once provided, call user_login(email=..., password=...).
- If the user asks to register, sign up, or create an account, ask for their first name, last name, email address, password, and optional phone. Once provided, call user_signup(first_name=..., last_name=..., email=..., password=..., phone=...).
- Once authenticated, confirm their login and continue with their salon needs.
5) Booking & Confirmation:
- When the client wants to book or reserve an appointment (e.g. 'book haircut tomorrow at 2pm', 'reserve this appointment', 'confirm my booking'), call book_and_confirm_appointment(service_query=..., preferred_time=...). This locks in the slot and automatically confirms the booking with a $0 PayPal hold.
- If they ask to confirm an existing pending booking, call confirm_existing_booking().

Rules:
- Keep answers to 1–2 short spoken sentences. No markdown or bullet lists.
- Never invent salons, prices, or open slots.
- Prefer calling search_salon_services when the client asks what is available.
- When the user asks to log in or register, use the user_login or user_signup tools.
- When the user asks to book or confirm an appointment, use the book_and_confirm_appointment tool.
- If the user says goodbye, thank them and end the call.
""".strip()


def build_voice_instructions(language: str = "en", location_summary: str | None = None) -> str:
    base = INSTRUCTIONS_EN
    if location_summary:
        return f"{base}\n\n{location_summary}"
    return base


# Multi-word farewells (word-boundary match only — never raw substring).
_FAREWELL_PHRASES = (
    "good bye",
    "good buy",
    "see you",
    "see ya",
    "that's all",
    "that is all",
    "that's it",
    "that is it",
    "hang up",
    "end call",
    "end the call",
    "close call",
    "stop call",
    "ደህና ሁን",
    "ደህና ሁኑ",
)

# Single-token farewells. Never use `token in text` for short tokens like "bye"
# — that falsely matches words such as "nearby".
_FAREWELL_TOKENS = frozenset(
    {
        "bye",
        "by",
        "goodbye",
        "goodbuy",
        "cya",
        "farewell",
        "quit",
        "exit",
        "ቻው",
    }
)

# Clear booking/search intent must never end the call.
_ACTIVE_REQUEST_HINTS = (
    "search",
    "find",
    "looking",
    "book",
    "booking",
    "appointment",
    "schedule",
    "available",
    "nearby",
    "near me",
    "haircut",
    "service",
    "salon",
    "price",
    "reserve",
    "slot",
)

BOOKING_HINTS = (
    "book",
    "booking",
    "appointment",
    "schedule",
    "available",
    "availability",
    "reserve",
    "slot",
)


def is_farewell(text: str) -> bool:
    """True only for clear goodbye utterances — not booking/search requests.

    Important: do not use naive ``\"bye\" in text`` matching; that fires on
    words like ``nearby``.
    """
    cleaned = (text or "").lower().strip()
    if not cleaned:
        return False

    # Long active requests should never end the call.
    if any(h in cleaned for h in _ACTIVE_REQUEST_HINTS) and len(cleaned) > 24:
        return False

    words = set(re.findall(r"\b\w+\b", cleaned))
    if words.intersection(_FAREWELL_TOKENS):
        # Prefer short goodbye turns ("bye", "ok bye thanks") over long mixed text.
        if len(words) <= 8:
            return True
        non_farewell = words - _FAREWELL_TOKENS - {"ok", "okay", "thanks", "thank", "you", "please"}
        return len(non_farewell) <= 2

    for phrase in _FAREWELL_PHRASES:
        if re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", cleaned):
            return True
    return False


def is_booking_flow(text: str) -> bool:
    lowered = (text or "").lower()
    return any(h in lowered for h in BOOKING_HINTS)


def greeting_for(language: str) -> str:
    return GREETING_AM if language == "am" else GREETING_EN
