import pytest

from app.core.config import get_settings


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(autouse=True)
def paypal_stub_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    """Keep tests off the real PayPal sandbox even when `.env` has credentials."""
    settings = get_settings()
    monkeypatch.setattr(settings, "paypal_client_id", "")
    monkeypatch.setattr(settings, "paypal_client_secret", "")
