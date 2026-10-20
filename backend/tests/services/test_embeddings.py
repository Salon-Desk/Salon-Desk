import httpx
import pytest

from app.ai.embeddings import EmbeddingError, get_embedding, get_embeddings_batch
from app.core.config import Settings


@pytest.mark.asyncio
async def test_get_embeddings_batch_empty() -> None:
    res = await get_embeddings_batch([])
    assert res == []


@pytest.mark.asyncio
async def test_get_embedding_empty_error() -> None:
    with pytest.raises(EmbeddingError, match="Cannot embed empty text"):
        await get_embedding("   ")


@pytest.mark.asyncio
async def test_get_embeddings_batch_mocked() -> None:
    mock_embeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/embed"
        return httpx.Response(200, json={"model": "all-minilm", "embeddings": mock_embeddings})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        res = await get_embeddings_batch(
            ["text one", "text two"],
            settings=Settings(ollama_host="http://test-ollama"),
            client=client,
        )
        assert res == mock_embeddings


@pytest.mark.asyncio
async def test_get_embeddings_batch_fallback_legacy() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/embed":
            return httpx.Response(404)
        if request.url.path == "/api/embeddings":
            return httpx.Response(200, json={"embedding": [0.7, 0.8, 0.9]})
        return httpx.Response(400)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        res = await get_embeddings_batch(
            ["legacy prompt"],
            settings=Settings(ollama_host="http://test-ollama"),
            client=client,
        )
        assert res == [[0.7, 0.8, 0.9]]
