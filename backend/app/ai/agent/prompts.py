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
4) If they must sign in to book, say so briefly — keep their selection context.

Rules:
- Keep answers to 1–2 short spoken sentences. No markdown or bullet lists.
- Never invent salons, prices, or open slots.
- Prefer calling search_salon_services when the client asks what is available.
- If the user says goodbye, thank them and end the call.
""".strip()

FAREWELL_HINTS = (
    "bye",
    "by",
    "goodbye",
    "good bye",
    "goodbuy",
    "good buy",
    "see you",
    "see ya",
    "cya",
    "that's all",
    "that is all",
    "that's it",
    "that is it",
    "hang up",
    "end call",
    "end the call",
    "close call",
    "stop call",
    "quit",
    "exit",
    "farewell",
    "ደህና ሁን",
    "ደህና ሁኑ",
    "ቻው",
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

_FAREWELL_TOKENS = frozenset({"bye", "by", "goodbye", "goodbuy", "cya", "farewell", "quit", "exit"})


def is_farewell(text: str) -> bool:
    cleaned = (text or "").lower().strip()
    if not cleaned:
        return False
    words = set(re.findall(r"\b\w+\b", cleaned))
    if words.intersection(_FAREWELL_TOKENS):
        return True
    return any(h in cleaned for h in FAREWELL_HINTS)


def is_booking_flow(text: str) -> bool:
    lowered = (text or "").lower()
    return any(h in lowered for h in BOOKING_HINTS)


def greeting_for(language: str) -> str:
    return GREETING_AM if language == "am" else GREETING_EN
