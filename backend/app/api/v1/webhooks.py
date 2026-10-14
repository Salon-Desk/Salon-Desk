from fastapi import APIRouter, Request

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/paypal")
async def paypal_webhook(request: Request) -> dict[str, str]:
    _ = await request.body()
    return {"detail": "not implemented"}
