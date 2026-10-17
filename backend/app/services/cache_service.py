import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class CacheService:
    """Async Redis caching client with graceful degradation."""

    def __init__(self) -> None:
        self._client: aioredis.Redis | None = None

    def get_client(self) -> aioredis.Redis:
        if self._client is None:
            settings = get_settings()
            self._client = aioredis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                password=settings.redis_password,
                db=settings.redis_db,
                decode_responses=True,
                socket_connect_timeout=2.0,
            )
        return self._client

    async def ping(self) -> bool:
        try:
            client = self.get_client()
            res = await client.ping()
            return bool(res)
        except Exception as exc:
            logger.warning("Redis ping failed: %s", exc)
            return False

    async def get(self, key: str) -> str | None:
        try:
            client = self.get_client()
            return await client.get(key)
        except Exception as exc:
            logger.warning("Redis get error for %s: %s", key, exc)
            return None

    async def set(self, key: str, value: str, ttl_seconds: int | None = 300) -> bool:
        try:
            client = self.get_client()
            await client.set(key, value, ex=ttl_seconds)
            return True
        except Exception as exc:
            logger.warning("Redis set error for %s: %s", key, exc)
            return False

    async def get_json(self, key: str) -> Any | None:
        raw = await self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except Exception as exc:
            logger.warning("Failed to deserialize JSON for key %s: %s", key, exc)
            return None

    async def set_json(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        try:
            serialized = json.dumps(value, default=str)
            return await self.set(key, serialized, ttl_seconds=ttl_seconds)
        except Exception as exc:
            logger.warning("Failed to serialize JSON for key %s: %s", key, exc)
            return False

    async def delete(self, key: str) -> bool:
        try:
            client = self.get_client()
            await client.delete(key)
            return True
        except Exception as exc:
            logger.warning("Redis delete error for %s: %s", key, exc)
            return False

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()
            self._client = None


cache_service = CacheService()
