"""LLM providers selected by LLM_PROVIDER (groq | ollama | openai)."""

from __future__ import annotations

from typing import Any

from app.ai.llm.base import BaseLLMService, LLMError
from app.ai.llm.deepseek_service import DeepSeekLLMService
from app.ai.llm.groq_service import GroqLLMService
from app.ai.llm.ollama_service import OllamaLLMService
from app.ai.llm.openai_service import OpenAILLMService
from app.core.config import Settings, get_settings

__all__ = [
    "BaseLLMService",
    "DeepSeekLLMService",
    "GroqLLMService",
    "OllamaLLMService",
    "OpenAILLMService",
    "FallbackLLMService",
    "LLMError",
    "get_llm_service",
    "get_fallback_llm_service",
    # Back-compat aliases
    "LLMClient",
    "get_llm_client",
]


class FallbackLLMService(BaseLLMService):
    """Wraps a primary LLM with ordered fallback providers on network/provider failure."""

    def __init__(self, primary: BaseLLMService, fallbacks: list[BaseLLMService]) -> None:
        super().__init__(primary.settings)
        self.primary = primary
        self.fallbacks = fallbacks

    @property
    def provider_name(self) -> str:
        return self.primary.provider_name

    @property
    def model(self) -> str:
        return self.primary.model

    @property
    def base_url(self) -> str:
        return self.primary.base_url

    def api_key(self) -> str:
        return self.primary.api_key()

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = 1024,
        response_format: dict[str, Any] | None = None,
    ) -> str:
        chain = [self.primary, *self.fallbacks]
        last_err: Exception | None = None
        for service in chain:
            try:
                if (
                    service.provider_name in ("openai", "groq", "deepseek")
                    and not service.api_key()
                ):
                    continue
                return await service.chat(
                    messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    response_format=response_format,
                )
            except (LLMError, Exception) as exc:
                last_err = exc
                continue

        if last_err:
            raise LLMError(f"All LLM providers in fallback chain failed: {last_err}") from last_err
        raise LLMError("No active LLM providers configured in fallback chain")


def get_llm_service(settings: Settings | None = None) -> BaseLLMService:
    """Return the concrete provider class for the active LLM_PROVIDER."""
    cfg = settings or get_settings()
    if cfg.llm_provider == "openai":
        return OpenAILLMService(cfg)
    if cfg.llm_provider == "ollama":
        return OllamaLLMService(cfg)
    if cfg.llm_provider == "deepseek":
        return DeepSeekLLMService(cfg)
    return GroqLLMService(cfg)


def get_fallback_llm_service(settings: Settings | None = None) -> BaseLLMService:
    """Return a FallbackLLMService prioritizing the active LLM_PROVIDER with fallback chain."""
    cfg = settings or get_settings()
    primary = get_llm_service(cfg)
    candidates = [
        DeepSeekLLMService(cfg),
        GroqLLMService(cfg),
        OpenAILLMService(cfg),
        OllamaLLMService(cfg),
    ]
    fallbacks = [c for c in candidates if c.provider_name != primary.provider_name]
    return FallbackLLMService(primary, fallbacks)


# Aliases so existing imports keep working during the refactor.
LLMClient = BaseLLMService
get_llm_client = get_llm_service
