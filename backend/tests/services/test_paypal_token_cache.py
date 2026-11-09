import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.config import get_settings
from app.services.paypal_rest import (
    PayPalRestClient,
    _token_cache,
    close_paypal_http_client,
    get_paypal_http_client,
)


@pytest.mark.asyncio
async def test_paypal_http_client_singleton_and_close():
    client1 = await get_paypal_http_client()
    client2 = await get_paypal_http_client()
    assert client1 is client2
    assert not client1.is_closed

    await close_paypal_http_client()
    assert client1.is_closed

    # Next call creates a fresh active client
    client3 = await get_paypal_http_client()
    assert client3 is not client1
    assert not client3.is_closed
    await close_paypal_http_client()


@pytest.mark.asyncio
async def test_paypal_access_token_caching(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "paypal_client_id", "TEST_CLIENT_ID")
    monkeypatch.setattr(settings, "paypal_client_secret", "TEST_CLIENT_SECRET")

    # Reset cache
    _token_cache["token"] = ""
    _token_cache["expires_at"] = 0.0

    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "access_token": "ACCESS_TOKEN_XYZ",
        "expires_in": 3600,
    }

    client = PayPalRestClient()
    with patch.object(client, "_request", new=AsyncMock(return_value=mock_resp)) as mock_req:
        token1 = await client._access_token()
        assert token1 == "ACCESS_TOKEN_XYZ"
        assert mock_req.call_count == 1

        # Second call should read from memory cache
        token2 = await client._access_token()
        assert token2 == "ACCESS_TOKEN_XYZ"
        assert mock_req.call_count == 1

        # Expired cache should re-fetch
        _token_cache["expires_at"] = time.monotonic() - 10.0
        mock_resp.json.return_value = {
            "access_token": "ACCESS_TOKEN_NEW",
            "expires_in": 3600,
        }
        token3 = await client._access_token()
        assert token3 == "ACCESS_TOKEN_NEW"
        assert mock_req.call_count == 2
