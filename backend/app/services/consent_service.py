"""Client consent captured before a PayPal authorization hold."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import sha256_hex
from app.core.exceptions import ForbiddenError
from app.models.booking import Booking
from app.models.policy import Consent
from app.services.ledger_service import build_consent_signature


async def create_consent(
    db: AsyncSession,
    *,
    booking: Booking,
    client_id: UUID,
    terms_version: str,
    terms_text: str,
    signed_payload: str,
) -> Consent:
    if booking.client_id != client_id:
        raise ForbiddenError("Not your booking")
    terms_hash = sha256_hex(terms_text)
    canonical_payload = {
        "booking_id": str(booking.id),
        "client_id": str(client_id),
        "terms_version": terms_version,
        "terms_text_hash": terms_hash,
        "agreed_hold_amount": str(booking.agreed_hold_amount),
        "signed_payload": signed_payload,
    }
    _, signature = build_consent_signature(canonical_payload)
    consent = Consent(
        booking_id=booking.id,
        client_id=client_id,
        terms_version=terms_version,
        terms_text_hash=terms_hash,
        signature_b64=signature,
        signed_payload=signed_payload,
    )
    db.add(consent)
    await db.flush()
    return consent
