import pytest
from fastapi import APIRouter
from httpx import ASGITransport, AsyncClient

from app.core.response import error, success
from app.main import create_app


def test_response_models():
    succ = success({"id": 123}, message="Created")
    assert succ.success is True
    assert succ.data == {"id": 123}
    assert succ.message == "Created"
    assert succ.timestamp

    err = error(code="BAD_INPUT", message="Invalid", details={"field": "email"})
    assert err.success is False
    assert err.error.code == "BAD_INPUT"
    assert err.error.message == "Invalid"
    assert err.error.details == {"field": "email"}
    assert err.timestamp


@pytest.mark.asyncio
async def test_standardized_response_middleware_success():
    app = create_app()
    test_router = APIRouter(prefix="/api/v1/test-standard")

    @test_router.get("/data")
    async def get_test_data():
        return {"items": [1, 2, 3], "total": 3}

    @test_router.get("/string")
    async def get_test_string():
        return "hello world"

    app.include_router(test_router)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/test-standard/data")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"] == {"items": [1, 2, 3], "total": 3}
        assert "timestamp" in body

        resp_str = await client.get("/api/v1/test-standard/string")
        assert resp_str.status_code == 200
        body_str = resp_str.json()
        assert body_str["success"] is True
        assert body_str["data"] == "hello world"


@pytest.mark.asyncio
async def test_standardized_response_middleware_errors():
    app = create_app()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 404
        resp = await client.get("/api/v1/catalog/non-existent-endpoint-1234")
        assert resp.status_code == 404
        body = resp.json()
        assert body["success"] is False
        assert "error" in body
        assert body["error"]["message"]
        assert "timestamp" in body


@pytest.mark.asyncio
async def test_standardized_response_middleware_skips_health_and_docs():
    app = create_app()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # /health
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}

        # /openapi.json
        resp_openapi = await client.get("/openapi.json")
        assert resp_openapi.status_code == 200
        assert "openapi" in resp_openapi.json()
