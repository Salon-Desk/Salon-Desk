"""Ollama LLM provider (local OpenAI-compatible API)."""

from __future__ import annotations

from app.ai.llm.base import BaseLLMService
from app.core.config import Settings


class OllamaLLMService(BaseLLMService):
    provider_name = "ollama"

    def __init__(self, settings: Settings | None = None) -> None:
        super().__init__(settings)

    @property
    def model(self) -> str:
        return self.settings.ollama_model

    @property
    def base_url(self) -> str:
        return self.settings.ollama_base_url.rstrip("/")

    def api_key(self) -> str:
        # Local Ollama typically ignores auth; keep a stable placeholder.
        return self.settings.ollama_api_key or "ollama"

    def require_api_key(self) -> str:
        return self.api_key()
