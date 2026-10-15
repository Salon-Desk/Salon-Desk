from fastapi import APIRouter, Request

from app.api.deps import DbSession
from app.schemas.common import MessageOut
from app.services.payment_service import ingest_webhook

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/paypal", response_model=MessageOut)
async def paypal_webhook(request: Request, db: DbSession) -> MessageOut:
    payload = await request.json()
    event_id = str(payload.get("id") or payload.get("event_id") or "")
    event_type = str(payload.get("event_type") or "UNKNOWN")
    resource = payload.get("resource") or {}
    if not event_id:
        return MessageOut(detail="ignored: missing event id")

    await ingest_webhook(
        db,
        paypal_event_id=event_id,
        event_type=event_type,
        resource=resource if isinstance(resource, dict) else {},
        verification_status="UNVERIFIED",
    )
    return MessageOut(detail="accepted")
