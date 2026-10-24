"""Room language, portal, and LLM setup for the LiveKit voice worker."""

from __future__ import annotations

import json

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.services.livekit_tokens import parse_language_from_room_name, parse_portal_from_room_name

from .constants import _NOISE_RE


def is_garbage_transcript(text: str) -> bool:
    """Check if transcript is noise/garbage."""
    cleaned = (text or "").strip()
    if len(cleaned) < 2:
        return True
    return bool(_NOISE_RE.match(cleaned.replace(" ", "")))


def resolve_language(room_name: str, metadata: str | None) -> str:
    """Resolve language from room metadata or room name."""
    if metadata:
        try:
            data = json.loads(metadata)
            lang = data.get("language")
            if lang in {"en", "am"}:
                return lang
        except json.JSONDecodeError:
            pass
    return parse_language_from_room_name(room_name)


def resolve_portal(room_name: str, metadata: str | None) -> str:
    """Resolve assistant portal from room metadata or room name."""
    if metadata:
        try:
            data = json.loads(metadata)
            portal = data.get("portal")
            if portal in {"client", "merchant", "admin"}:
                return portal
        except json.JSONDecodeError:
            pass
    return parse_portal_from_room_name(room_name)


def openai_compatible_llm():
    """Create OpenAI-compatible LLM instance based on settings."""
    from livekit.plugins import openai as lk_openai

    settings = get_settings()
    provider = settings.active_voice_llm_provider

    if provider == "openai":
        return lk_openai.LLM(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )

    if provider == "ollama":
        return lk_openai.LLM(
            model=settings.ollama_model,
            api_key=settings.ollama_api_key or "ollama",
            base_url=settings.ollama_base_url,
        )

    if provider == "deepseek":
        return lk_openai.LLM(
            model=settings.deepseek_model,
            api_key=settings.deepseek_api_key or settings.deepgram_api_key,
            base_url=settings.deepseek_base_url,
        )

    return lk_openai.LLM(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        base_url=settings.groq_base_url,
    )


def build_session_factory():
    """Reuse centralized database session factory."""
    return AsyncSessionLocal
