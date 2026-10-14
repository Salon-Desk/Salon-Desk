"""Direct PayPal REST Orders/Payments v2 client (authorize, capture, void)."""

from decimal import Decimal

import httpx

from app.core.config import get_settings


class PayPalRestClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def _access_token(self) -> str:
        # Placeholder — implement OAuth client-credentials flow
        return ""

    async def authorize_order(
        self, *, amount: Decimal, currency: str = "USD"
    ) -> dict:
        _ = amount, currency
        async with httpx.AsyncClient() as client:
            _ = client
        return {"status": "not_implemented"}

    async def partial_capture(
        self, *, authorization_id: str, amount: Decimal
    ) -> dict:
        _ = authorization_id, amount
        return {"status": "not_implemented"}

    async def void_authorization(self, *, authorization_id: str) -> dict:
        _ = authorization_id
        return {"status": "not_implemented"}
