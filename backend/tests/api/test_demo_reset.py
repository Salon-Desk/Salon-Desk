from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.mark.asyncio
async def test_demo_reset_both_routes_and_graceful_ingest_failure():
    app = create_app()
    transport = ASGITransport(app=app)

    with (
        patch("scripts.seed.run_seed", new_callable=AsyncMock) as mock_seed,
        patch("scripts.ingest_knowledge.ingest", new_callable=AsyncMock) as mock_ingest,
    ):
        mock_seed.return_value = None
        # Simulate Ollama offline in unit test environment
        mock_ingest.side_effect = RuntimeError("Ollama container unreachable")

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Test /api/demo/reset
            resp_api = await client.post("/api/demo/reset")
            assert resp_api.status_code == 200
            data_api = resp_api.json()
            assert data_api["data"]["detail"] == "demo database cleared and re-seeded"

            # Test /api/v1/demo/reset
            resp_v1 = await client.post("/api/v1/demo/reset")
            assert resp_v1.status_code == 200
            data_v1 = resp_v1.json()
            assert data_v1["data"]["detail"] == "demo database cleared and re-seeded"

        assert mock_seed.call_count == 2
        assert mock_ingest.call_count == 2
