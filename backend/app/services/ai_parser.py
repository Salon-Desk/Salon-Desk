"""LLM slot-parsing fallback chain: DeepSeek -> Groq -> Gemini."""

from app.schemas.ai import SlotParseResult


class AISlotParser:
    async def parse(self, user_text: str) -> SlotParseResult:
        _ = user_text
        return SlotParseResult(confidence=0.0)
