"""Groq LLM provider (OpenAI-compatible API)."""

from __future__ import annotations

from app.core.config import Settings
from app.services.llm.base import BaseLLMService, LLMError


class GroqLLMService(BaseLLMService):
    provider_name = "groq"

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)

    @property
    def model(self) -> str:
        return self.settings.groq_model

    @property
    def base_url(self) -> str:
        return self.settings.groq_base_url.rstrip("/")

    def api_key(self) -> str:
        return self.settings.groq_api_key

    def require_api_key(self) -> str:
        key = self.api_key()
        if not key:
            raise LLMError("LLM_PROVIDER=groq requires GROQ_API_KEY in the environment")
        return key
