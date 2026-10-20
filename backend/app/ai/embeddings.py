"""Ollama embeddings for RAG ingest + query (all-minilm → 384-d)."""

from __future__ import annotations

import asyncio
import logging

import httpx

from app.core.config import Settings, get_settings
from app.core.exceptions import SalonDeskError

logger = logging.getLogger(__name__)

# Keep prompts short to avoid embed-model context overflow.
_MAX_EMBED_CHARS = 600


class EmbeddingError(SalonDeskError):
    pass


# Shared client cache for connection reuse across calls
_HTTP_CLIENT: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None or _HTTP_CLIENT.is_closed:
        _HTTP_CLIENT = httpx.AsyncClient(timeout=60.0)
    return _HTTP_CLIENT


async def get_embeddings_batch(
    texts: list[str],
    *,
    settings: Settings | None = None,
    batch_size: int = 50,
    client: httpx.AsyncClient | None = None,
) -> list[list[float]]:
    """Compute vector embeddings in batches using Ollama's /api/embed (with fallback)."""
    if not texts:
        return []

    cfg = settings or get_settings()
    http = client or _get_http_client()
    embed_url = f"{cfg.ollama_host.rstrip('/')}/api/embed"
    legacy_url = f"{cfg.ollama_host.rstrip('/')}/api/embeddings"

    cleaned_texts = [(t or "").strip()[:_MAX_EMBED_CHARS] or " " for t in texts]
    all_embeddings: list[list[float]] = []

    for i in range(0, len(cleaned_texts), batch_size):
        batch = cleaned_texts[i : i + batch_size]
        payload = {"model": cfg.ollama_embed_model, "input": batch}

        batch_embeddings: list[list[float]] | None = None
        last_exc: Exception | None = None

        for attempt in range(3):
            try:
                response = await http.post(embed_url, json=payload)
                if response.status_code == 404:
                    # Older Ollama version without /api/embed fallback to sequential /api/embeddings
                    batch_embeddings = []
                    for prompt in batch:
                        legacy_resp = await http.post(
                            legacy_url, json={"model": cfg.ollama_embed_model, "prompt": prompt}
                        )
                        legacy_resp.raise_for_status()
                        batch_embeddings.append(
                            [float(x) for x in legacy_resp.json().get("embedding", [])]
                        )
                    break

                if response.status_code >= 400:
                    raise EmbeddingError(
                        f"Ollama embeddings returned {response.status_code}: {response.text[:300]}"
                    )

                data = response.json()
                raw_embeds = data.get("embeddings")
                if not isinstance(raw_embeds, list) or len(raw_embeds) != len(batch):
                    raise EmbeddingError("Ollama response missing expected embeddings array")

                batch_embeddings = [[float(x) for x in vec] for vec in raw_embeds]
                break
            except (httpx.HTTPError, EmbeddingError) as exc:
                last_exc = exc
                if attempt < 2:
                    logger.warning(
                        "Ollama batch embeddings attempt %d failed: %s; retrying in %ds...",
                        attempt + 1,
                        exc,
                        attempt + 1,
                    )
                    await asyncio.sleep(float(attempt + 1))
                else:
                    break

        if batch_embeddings is None:
            raise EmbeddingError(
                f"Ollama batch embeddings request failed: {last_exc}"
            ) from last_exc

        all_embeddings.extend(batch_embeddings)

    return all_embeddings


async def get_embedding(
    text: str,
    *,
    settings: Settings | None = None,
    client: httpx.AsyncClient | None = None,
) -> list[float]:
    prompt = (text or "").strip()[:_MAX_EMBED_CHARS]
    if not prompt:
        raise EmbeddingError("Cannot embed empty text")

    embeddings = await get_embeddings_batch([prompt], settings=settings, client=client)
    if not embeddings:
        raise EmbeddingError("Empty embedding returned")
    return embeddings[0]
