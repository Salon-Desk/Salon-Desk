from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import get_settings
from app.main import create_app
from app.services.cache_service import CacheService
from app.services.storage_service import StorageService, StorageUnavailableError


@pytest.mark.asyncio
async def test_cache_service_fallback():
    service = CacheService()
    # Mocking redis client to simulate offline redis
    with patch.object(service, "get_client") as mock_get_client:
        mock_redis = MagicMock()
        mock_redis.ping.side_effect = ConnectionError("Redis down")
        mock_redis.get.side_effect = ConnectionError("Redis down")
        mock_redis.set.side_effect = ConnectionError("Redis down")
        mock_get_client.return_value = mock_redis

        assert await service.ping() is False
        assert await service.get_json("any-key") is None
        assert await service.set_json("any-key", {"val": 1}) is False


@pytest.mark.asyncio
async def test_storage_service_upload_and_get():
    service = StorageService()
    with patch.object(service, "get_client") as mock_get_client:
        mock_s3 = MagicMock()
        mock_get_client.return_value = mock_s3

        key, url = service.upload_bytes(
            data=b"image-data",
            filename="profile.png",
            content_type="image/png",
            folder="avatars",
        )
        assert key.startswith("avatars/")
        assert key.endswith(".png")
        assert "/api/v1/storage/salondesk-assets/avatars/" in url

        mock_s3.put_object.assert_called_once()
        put_kwargs = mock_s3.put_object.call_args[1]
        assert put_kwargs["Bucket"] == "salondesk-assets"
        assert put_kwargs["Key"] == key
        assert put_kwargs["Body"] == b"image-data"
        assert put_kwargs["ContentType"] == "image/png"


def test_local_storage_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.setenv("STORAGE_LOCAL_DIR", str(tmp_path))
    get_settings.cache_clear()
    try:
        service = StorageService()
        key, url = service.upload_bytes(
            data=b"image-data",
            filename="logo.png",
            content_type="image/png",
            folder="logos",
        )
        assert key.startswith("logos/")
        assert url.endswith(f"/salondesk-assets/{key}")
        data, content_type = service.get_object(key)
        assert data == b"image-data"
        assert content_type == "image/png"
        assert service.delete_object(key) is True
        with pytest.raises(FileNotFoundError):
            service.get_object(key)
        with pytest.raises(StorageUnavailableError):
            service.get_object("../etc/passwd")
    finally:
        get_settings.cache_clear()


@pytest.mark.asyncio
async def test_storage_proxy_endpoint():
    app = create_app()
    with patch("app.services.storage_service.storage_service.async_get_object") as mock_get_obj:
        mock_get_obj.return_value = (b"mock-image-content", "image/png")
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/v1/storage/salondesk-assets/avatars/test.png")
            assert resp.status_code == 200
            assert resp.content == b"mock-image-content"
            assert resp.headers["content-type"] == "image/png"
            assert "max-age=86400" in resp.headers["cache-control"]
