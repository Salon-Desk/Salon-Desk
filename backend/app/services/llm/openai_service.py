"""OpenAI LLM provider."""

from __future__ import annotations

from app.core.config import Settings
from app.services.llm.base import BaseLLMService, LLMError


class OpenAILLMService(BaseLLMService):
    provider_name = "openai"

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)

    @property
    def model(self) -> str:
        return self.settings.openai_model

    @property
    def base_url(self) -> str:
        return self.settings.openai_base_url.rstrip("/")

    def api_key(self) -> str:
        return self.settings.openai_api_key

    def require_api_key(self) -> str:
        key = self.api_key()
        if not key:
            raise LLMError("LLM_PROVIDER=openai requires OPENAI_API_KEY in the environment")
        return key
