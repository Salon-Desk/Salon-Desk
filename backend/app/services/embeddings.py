"""Ollama embeddings for RAG ingest + query (all-minilm → 384-d)."""

from __future__ import annotations

import logging

import httpx

from app.core.config import Settings, get_settings
from app.core.exceptions import SalonDeskError

logger = logging.getLogger(__name__)

# Keep prompts short to avoid embed-model context overflow.
_MAX_EMBED_CHARS = 600


class EmbeddingError(SalonDeskError):
    pass


async def get_embedding(
    text: str,
    *,
    settings: Settings | None = None,
) -> list[float]:
    cfg = settings or get_settings()
    prompt = (text or "").strip()[:_MAX_EMBED_CHARS]
    if not prompt:
        raise EmbeddingError("Cannot embed empty text")

    url = f"{cfg.ollama_host.rstrip('/')}/api/embeddings"
    payload = {"model": cfg.ollama_embed_model, "prompt": prompt}

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
    except httpx.HTTPError as exc:
        raise EmbeddingError(f"Ollama embeddings request failed: {exc}") from exc

    if response.status_code >= 400:
        raise EmbeddingError(
            f"Ollama embeddings returned {response.status_code}: {response.text[:300]}"
        )

    data = response.json()
    embedding = data.get("embedding")
    if not isinstance(embedding, list) or not embedding:
        raise EmbeddingError("Ollama response missing embedding vector")
    return [float(x) for x in embedding]
