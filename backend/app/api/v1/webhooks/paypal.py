import logging

from fastapi import APIRouter, Request

from app.api.deps import DbSession
from app.schemas.common import MessageOut
from app.services.payment_service import ingest_webhook
from app.services.paypal_rest import PayPalRestClient

logger = logging.getLogger("salondesk.webhooks.paypal")
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/paypal", response_model=MessageOut)
async def paypal_webhook(request: Request, db: DbSession) -> MessageOut:
    payload = await request.json()
    event_id = str(payload.get("id") or payload.get("event_id") or "")
    event_type = str(payload.get("event_type") or "UNKNOWN")
    resource = payload.get("resource") or {}
    if not event_id:
        return MessageOut(detail="ignored: missing event id")

    # Extract PayPal cryptographic signature headers
    transmission_id = request.headers.get("paypal-transmission-id")
    transmission_time = request.headers.get("paypal-transmission-time")
    cert_url = request.headers.get("paypal-cert-url")
    auth_algo = request.headers.get("paypal-auth-algo")
    transmission_sig = request.headers.get("paypal-transmission-sig")

    paypal_client = PayPalRestClient()
    has_headers = bool(transmission_id and transmission_sig)

    # Validate signature against PayPal REST API when configured
    is_valid = await paypal_client.verify_webhook_signature(
        transmission_id=transmission_id,
        transmission_time=transmission_time,
        cert_url=cert_url,
        auth_algo=auth_algo,
        transmission_sig=transmission_sig,
        raw_body=payload,
    )

    if not is_valid:
        logger.warning(
            "Rejected PayPal webhook %s (%s): signature verification failed",
            event_id,
            event_type,
        )
        return MessageOut(detail="rejected: invalid signature")

    verification_status = "VERIFIED" if (has_headers and paypal_client.configured) else "UNVERIFIED"

    await ingest_webhook(
        db,
        paypal_event_id=event_id,
        event_type=event_type,
        resource=resource if isinstance(resource, dict) else {},
        verification_status=verification_status,
    )
    return MessageOut(detail="accepted")
