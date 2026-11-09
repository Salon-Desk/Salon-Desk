"""LLM slot-parsing for booking assistant (provider selected via LLM_PROVIDER)."""

from __future__ import annotations

from datetime import datetime

from app.ai.json_utils import extract_json as _extract_json
from app.ai.llm import BaseLLMService, LLMError, get_fallback_llm_service
from app.schemas.ai import SlotParseResult

_SYSTEM = """You extract salon booking slots from user text.
Return ONLY a JSON object with keys:
service_hint (string|null), starts_at (ISO-8601 string|null),
stylist_hint (string|null), notes (string|null), confidence (0..1 number).
Do not wrap in markdown."""


class AISlotParser:
    def __init__(self, client: BaseLLMService | None = None) -> None:
        self.client = client or get_fallback_llm_service()

    async def parse(self, user_text: str) -> SlotParseResult:
        if not user_text.strip():
            return SlotParseResult(confidence=0.0)

        try:
            raw = await self.client.chat(
                [
                    {"role": "system", "content": _SYSTEM},
                    {"role": "user", "content": user_text},
                ],
                temperature=0.0,
                max_tokens=400,
            )
        except LLMError:
            return SlotParseResult(confidence=0.0, notes="llm_unavailable")

        data = _extract_json(raw)
        if data is None:
            return SlotParseResult(confidence=0.0, notes=raw[:200])

        starts_at = None
        if data.get("starts_at"):
            try:
                starts_at = datetime.fromisoformat(str(data["starts_at"]).replace("Z", "+00:00"))
            except ValueError:
                starts_at = None

        confidence = data.get("confidence", 0.0)
        try:
            confidence_f = float(confidence)
        except (TypeError, ValueError):
            confidence_f = 0.0
        confidence_f = max(0.0, min(1.0, confidence_f))

        return SlotParseResult(
            service_hint=data.get("service_hint"),
            starts_at=starts_at,
            stylist_hint=data.get("stylist_hint"),
            notes=data.get("notes"),
            confidence=confidence_f,
        )
