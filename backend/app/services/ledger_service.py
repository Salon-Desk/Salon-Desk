"""Append-only hash-chained ledger writer, consent signatures, and chain auditor."""

from __future__ import annotations

import json
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import chain_hash, sha256_hex, sign_message, verify_signature
from app.models.ledger import LedgerEntry

GENESIS_HASH = "0" * 64
_LEDGER_ADVISORY_LOCK_ID = 849302194


def build_consent_signature(payload: str | dict[str, Any]) -> tuple[str, str]:
    """Return (payload_hash, signature_b64). Canonicalizes if a dict payload is passed."""
    if isinstance(payload, dict):
        payload_str = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    else:
        payload_str = str(payload)
    return sha256_hex(payload_str), sign_message(payload_str)


def verify_consent_signature(
    payload: str | dict[str, Any],
    signature_b64: str,
) -> bool:
    """Verify Ed25519 signature of consent payload."""
    if isinstance(payload, dict):
        payload_str = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    else:
        payload_str = str(payload)
    return verify_signature(payload_str, signature_b64)


def append_ledger_hash(previous_hash: str, payload: str) -> str:
    """Compute new chain hash from previous_hash and payload."""
    return chain_hash(previous_hash, payload)


async def _latest_ledger_hash(db: AsyncSession) -> str:
    stmt = (
        select(LedgerEntry).order_by(LedgerEntry.created_at.desc(), LedgerEntry.id.desc()).limit(1)
    )
    if db.bind and db.bind.dialect.name == "postgresql":
        stmt = stmt.with_for_update()
    result = await db.execute(stmt)
    entry = result.scalar_one_or_none()
    return entry.entry_hash if entry else GENESIS_HASH


async def append_ledger(
    db: AsyncSession,
    *,
    event_type: str,
    payload: dict[str, Any],
    org_id: UUID | None = None,
    booking_id: UUID | None = None,
    hold_id: UUID | None = None,
    amount: Decimal | None = None,
    currency: str | None = None,
    paypal_debug_id: str | None = None,
) -> LedgerEntry:
    """Append a tamper-evident audit record to the hash-chained financial ledger."""
    # Serialize concurrent appends when running under PostgreSQL to avoid chain forks
    try:
        if db.bind and db.bind.dialect.name == "postgresql":
            await db.execute(text(f"SELECT pg_advisory_xact_lock({_LEDGER_ADVISORY_LOCK_ID})"))
    except Exception:
        pass

    previous = await _latest_ledger_hash(db)
    payload_str = json.dumps(payload, sort_keys=True, default=str)
    entry = LedgerEntry(
        org_id=org_id,
        booking_id=booking_id,
        hold_id=hold_id,
        event_type=event_type,
        amount=amount,
        currency=currency,
        payload_json=payload,
        previous_hash=previous,
        entry_hash=append_ledger_hash(previous, payload_str),
        paypal_debug_id=paypal_debug_id,
    )
    db.add(entry)
    await db.flush()
    return entry


async def verify_ledger_chain(
    db: AsyncSession,
    booking_id: UUID | None = None,
) -> tuple[bool, int, str | None]:
    """
    Verify the cryptographic integrity of the ledger chain.
    If booking_id is provided, verifies that entries for that booking are validly hashed.
    Otherwise verifies the global chain sequence.

    Returns:
        (is_valid, verified_count, error_detail_or_none)
    """
    stmt = select(LedgerEntry)
    if booking_id:
        stmt = stmt.where(LedgerEntry.booking_id == booking_id)
    stmt = stmt.order_by(LedgerEntry.created_at.asc(), LedgerEntry.id.asc())
    result = await db.execute(stmt)
    entries = list(result.scalars().all())

    if not entries:
        return True, 0, None

    if booking_id:
        for idx, entry in enumerate(entries):
            payload_str = json.dumps(entry.payload_json, sort_keys=True, default=str)
            computed_hash = append_ledger_hash(entry.previous_hash, payload_str)
            if entry.entry_hash != computed_hash:
                compact_str = json.dumps(
                    entry.payload_json, sort_keys=True, separators=(",", ":"), default=str
                )
                if entry.entry_hash != append_ledger_hash(entry.previous_hash, compact_str):
                    return (
                        False,
                        idx,
                        f"Hash mismatch at entry {entry.id} (index {idx}): "
                        f"entry_hash '{entry.entry_hash}' != computed '{computed_hash}'",
                    )
        return True, len(entries), None

    expected_prev = GENESIS_HASH
    for idx, entry in enumerate(entries):
        if entry.previous_hash != expected_prev:
            return (
                False,
                idx,
                f"Broken chain at entry {entry.id} (index {idx}): "
                f"previous_hash '{entry.previous_hash}' != expected '{expected_prev}'",
            )

        payload_str = json.dumps(entry.payload_json, sort_keys=True, default=str)
        computed_hash = append_ledger_hash(expected_prev, payload_str)
        if entry.entry_hash != computed_hash:
            # Check canonical compact separators format as well
            compact_str = json.dumps(
                entry.payload_json, sort_keys=True, separators=(",", ":"), default=str
            )
            if entry.entry_hash != append_ledger_hash(expected_prev, compact_str):
                return (
                    False,
                    idx,
                    f"Hash mismatch at entry {entry.id} (index {idx}): "
                    f"entry_hash '{entry.entry_hash}' != computed '{computed_hash}'",
                )

        expected_prev = entry.entry_hash

    return True, len(entries), None
