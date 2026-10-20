"""DeepSeek LLM provider."""

from __future__ import annotations

from app.ai.llm.base import BaseLLMService, LLMError
from app.core.config import Settings


class DeepSeekLLMService(BaseLLMService):
    provider_name = "deepseek"

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)

    @property
    def model(self) -> str:
        return self.settings.deepseek_model

    @property
    def base_url(self) -> str:
        return self.settings.deepseek_base_url.rstrip("/")

    def api_key(self) -> str:
        return self.settings.deepseek_api_key or self.settings.deepgram_api_key

    def require_api_key(self) -> str:
        key = self.api_key()
        if not key:
            raise LLMError(
                "LLM_PROVIDER=deepseek requires DEEPSEEK_API_KEY (or DEEPGRAM_API_KEY) in the environment"
            )
        return key
