"""Shared LLM interface and OpenAI-compatible HTTP helpers."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.exceptions import SalonDeskError

logger = logging.getLogger(__name__)


class LLMError(SalonDeskError):
    """Raised when an LLM provider call fails."""


class BaseLLMService(ABC):
    """Provider-specific chat service."""

    provider_name: str

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    @property
    @abstractmethod
    def model(self) -> str:
        """Model id for this provider."""

    @property
    @abstractmethod
    def base_url(self) -> str:
        """OpenAI-compatible API base URL (no trailing slash)."""

    @abstractmethod
    def api_key(self) -> str:
        """API key / bearer token (may be a placeholder for local providers)."""

    def require_api_key(self) -> str:
        key = self.api_key()
        if not key:
            raise LLMError(
                f"LLM_PROVIDER={self.provider_name} requires an API key in the environment"
            )
        return key

    def build_headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.require_api_key()}",
        }

    def build_payload(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float,
        max_tokens: int | None,
        response_format: dict[str, Any] | None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        if response_format is not None:
            payload["response_format"] = response_format
        return payload

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = 1024,
        response_format: dict[str, Any] | None = None,
    ) -> str:
        """Return assistant message content from chat/completions."""
        url = f"{self.base_url}/chat/completions"
        payload = self.build_payload(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
        )
        logger.debug(
            "LLM request provider=%s model=%s url=%s",
            self.provider_name,
            self.model,
            url,
        )
        try:
            async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
                response = await client.post(url, headers=self.build_headers(), json=payload)
        except httpx.HTTPError as exc:
            raise LLMError(f"LLM request failed ({self.provider_name}): {exc}") from exc

        if response.status_code >= 400:
            detail = response.text[:500]
            raise LLMError(
                f"LLM provider {self.provider_name} returned {response.status_code}: {detail}"
            )

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMError(f"Unexpected LLM response shape from {self.provider_name}") from exc

        if not isinstance(content, str) or not content.strip():
            raise LLMError(f"Empty completion from {self.provider_name}")
        return content
