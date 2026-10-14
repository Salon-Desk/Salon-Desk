"""Consent records and tamper-proof hash-chain ledger appender."""

from app.core.crypto import chain_hash, sha256_hex, sign_message


def build_consent_signature(payload: str) -> tuple[str, str]:
    """Return (payload_hash, signature_b64)."""
    return sha256_hex(payload), sign_message(payload)


def append_ledger_hash(previous_hash: str, payload: str) -> str:
    return chain_hash(previous_hash, payload)
