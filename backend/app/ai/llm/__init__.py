"""LLM providers selected by LLM_PROVIDER (groq | ollama | openai)."""

from __future__ import annotations

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
    "LLMError",
    "get_llm_service",
    # Back-compat aliases
    "LLMClient",
    "get_llm_client",
]


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


# Aliases so existing imports keep working during the refactor.
LLMClient = BaseLLMService
get_llm_client = get_llm_service
