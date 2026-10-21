"""Shared LLM interface and OpenAI-compatible HTTP helpers."""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.core.config import Settings, get_settings
from app.core.exceptions import SalonDeskError

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def wrap_user_input(text: str) -> str:
    """Delimits user-supplied text with <user_input> tags to prevent prompt injection."""
    cleaned = text.replace("</user_input>", "").strip()
    return f"<user_input>\n{cleaned}\n</user_input>"


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

    @staticmethod
    def wrap_user_input(text: str) -> str:
        """Helper to delimit user input."""
        return wrap_user_input(text)

    async def chat_structured(
        self,
        messages: list[dict[str, str]],
        schema: type[T],
        *,
        temperature: float = 0.1,
        max_tokens: int | None = 1024,
        max_retries: int = 1,
    ) -> T:
        """Call LLM requesting JSON output and parse into Pydantic schema with retry."""
        system_instruction = (
            "You must output valid JSON adhering strictly to this JSON Schema:\n"
            f"{json.dumps(schema.model_json_schema())}"
        )
        current_messages = [
            {"role": "system", "content": system_instruction},
            *messages,
        ]

        last_error: Exception | None = None
        for attempt in range(max_retries + 1):
            response_text = await self.chat(
                current_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )
            clean_text = response_text.strip()
            if clean_text.startswith("```"):
                lines = clean_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                clean_text = "\n".join(lines).strip()
            try:
                parsed_json = json.loads(clean_text)
                return schema.model_validate(parsed_json)
            except (json.JSONDecodeError, ValidationError) as exc:
                last_error = exc
                if attempt < max_retries:
                    current_messages.append({"role": "assistant", "content": response_text})
                    current_messages.append(
                        {
                            "role": "user",
                            "content": (
                                f"The response was invalid: {exc}. "
                                "Please return only valid JSON adhering to the schema."
                            ),
                        }
                    )
        raise LLMError(
            f"Failed to parse structured LLM response into {schema.__name__}: {last_error}"
        ) from last_error
