"""Backward-compatible re-exports; prefer ``app.services.ledger_service``."""

from app.services.ledger_service import append_ledger_hash, build_consent_signature

__all__ = ["build_consent_signature", "append_ledger_hash"]
