"""Tests for LLM provider configuration and separate service classes."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.services.ai_parser import AISlotParser
from app.services.llm import (
    GroqLLMService,
    LLMError,
    OllamaLLMService,
    OpenAILLMService,
    get_llm_service,
)


def _settings(**kwargs: object) -> Settings:
    return Settings(_env_file=None, **kwargs)  # type: ignore[call-arg]


def test_llm_provider_defaults_to_groq(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    settings = _settings(groq_api_key="gkey")
    assert settings.llm_provider == "groq"
    svc = get_llm_service(settings)
    assert isinstance(svc, GroqLLMService)
    assert svc.model == "openai/gpt-oss-120b"
    assert "groq.com" in svc.base_url
    assert svc.api_key() == "gkey"


def test_factory_returns_openai_service() -> None:
    settings = _settings(
        llm_provider="openai",
        openai_api_key="sk-test",
        openai_model="gpt-4.1-mini",
    )
    svc = get_llm_service(settings)
    assert isinstance(svc, OpenAILLMService)
    assert svc.provider_name == "openai"
    assert svc.model == "gpt-4.1-mini"
    assert svc.api_key() == "sk-test"


def test_factory_returns_ollama_service(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "sk-should-not-bleed-into-ollama")
    settings = _settings(
        llm_provider="OLLAMA",
        ollama_model="llama3.2:1b",
        ollama_base_url="http://localhost:11434/v1",
        ollama_api_key="ollama",
    )
    svc = get_llm_service(settings)
    assert isinstance(svc, OllamaLLMService)
    assert svc.provider_name == "ollama"
    assert svc.model == "llama3.2:1b"
    assert svc.api_key() == "ollama"


def test_llm_provider_invalid_rejected() -> None:
    with pytest.raises(ValidationError):
        _settings(llm_provider="deepseek")


@pytest.mark.asyncio
async def test_groq_service_requires_api_key() -> None:
    svc = GroqLLMService(_settings(llm_provider="groq", groq_api_key=""))
    with pytest.raises(LLMError, match="GROQ_API_KEY"):
        await svc.chat([{"role": "user", "content": "hi"}])


@pytest.mark.asyncio
async def test_openai_service_requires_api_key() -> None:
    svc = OpenAILLMService(_settings(llm_provider="openai", openai_api_key=""))
    with pytest.raises(LLMError, match="OPENAI_API_KEY"):
        await svc.chat([{"role": "user", "content": "hi"}])


@pytest.mark.asyncio
async def test_openai_service_posts_chat_completions() -> None:
    svc = OpenAILLMService(
        _settings(
            llm_provider="openai",
            openai_api_key="sk-test",
            openai_model="gpt-4.1-mini",
        )
    )

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"choices": [{"message": {"content": "hello"}}]}

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.services.llm.base.httpx.AsyncClient", return_value=mock_client):
        text = await svc.chat([{"role": "user", "content": "hi"}])

    assert text == "hello"
    args, kwargs = mock_client.post.call_args
    assert args[0].endswith("/chat/completions")
    assert kwargs["json"]["model"] == "gpt-4.1-mini"
    assert kwargs["headers"]["Authorization"] == "Bearer sk-test"


@pytest.mark.asyncio
async def test_ollama_service_posts_without_cloud_key() -> None:
    svc = OllamaLLMService(
        _settings(
            llm_provider="ollama",
            ollama_model="llama3.2:1b",
            ollama_base_url="http://localhost:11434/v1",
        )
    )

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"choices": [{"message": {"content": "local hi"}}]}
    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.services.llm.base.httpx.AsyncClient", return_value=mock_client):
        text = await svc.chat([{"role": "user", "content": "hi"}])

    assert text == "local hi"
    assert mock_client.post.call_args.kwargs["json"]["model"] == "llama3.2:1b"


@pytest.mark.asyncio
async def test_ai_slot_parser_uses_llm_json() -> None:
    mock_client = MagicMock()
    mock_client.chat = AsyncMock(
        return_value='{"service_hint":"haircut","starts_at":null,'
        '"stylist_hint":null,"notes":null,"confidence":0.9}'
    )
    result = await AISlotParser(mock_client).parse("I want a haircut")
    assert result.service_hint == "haircut"
    assert result.confidence == 0.9
