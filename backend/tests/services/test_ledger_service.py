"""Tests for cryptographic audit integrity, persistent keys, and ledger verification."""

from __future__ import annotations

import json
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.core.crypto import (
    _load_or_create_private_key,
    chain_hash,
    sign_message,
    verify_signature,
)
from app.models.ledger import LedgerEntry
from app.services.ledger_service import (
    GENESIS_HASH,
    append_ledger,
    append_ledger_hash,
    build_consent_signature,
    verify_consent_signature,
    verify_ledger_chain,
)


def test_crypto_key_is_persistent() -> None:
    key1 = _load_or_create_private_key()
    key2 = _load_or_create_private_key()
    assert key1 is key2

    message = "Test SalonDesk cryptographic attestation"
    sig = sign_message(message)
    assert verify_signature(message, sig) is True
    assert verify_signature("Tampered message", sig) is False


def test_consent_canonical_dict_signing() -> None:
    payload_a = {"service": "Haircut", "amount": "50.00", "client_id": "123"}
    payload_b = {"amount": "50.00", "client_id": "123", "service": "Haircut"}

    hash_a, sig_a = build_consent_signature(payload_a)
    hash_b, sig_b = build_consent_signature(payload_b)

    assert hash_a == hash_b
    assert verify_consent_signature(payload_a, sig_a) is True
    assert verify_consent_signature(payload_b, sig_b) is True
    assert verify_consent_signature({"service": "Manicure"}, sig_a) is False


@pytest.mark.asyncio
async def test_verify_ledger_chain_empty() -> None:
    db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=mock_res)

    is_valid, count, err = await verify_ledger_chain(db)
    assert is_valid is True
    assert count == 0
    assert err is None


@pytest.mark.asyncio
async def test_verify_ledger_chain_valid_sequence() -> None:
    payload1 = {"action": "HOLD_CREATED", "amount": "50.00"}
    p1_str = json.dumps(payload1, sort_keys=True, default=str)
    hash1 = chain_hash(GENESIS_HASH, p1_str)

    entry1 = LedgerEntry(
        id=uuid4(),
        event_type="AUTHORIZATION_ORDER_CREATED",
        payload_json=payload1,
        previous_hash=GENESIS_HASH,
        entry_hash=hash1,
    )

    payload2 = {"action": "HOLD_CAPTURED", "amount": "50.00"}
    p2_str = json.dumps(payload2, sort_keys=True, default=str)
    hash2 = chain_hash(hash1, p2_str)

    entry2 = LedgerEntry(
        id=uuid4(),
        event_type="FULL_PAYMENT_CAPTURED",
        payload_json=payload2,
        previous_hash=hash1,
        entry_hash=hash2,
    )

    db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [entry1, entry2]
    db.execute = AsyncMock(return_value=mock_res)

    is_valid, count, err = await verify_ledger_chain(db)
    assert is_valid is True
    assert count == 2
    assert err is None


@pytest.mark.asyncio
async def test_verify_ledger_chain_detects_break() -> None:
    payload1 = {"action": "HOLD_CREATED"}
    hash1 = chain_hash(GENESIS_HASH, json.dumps(payload1, sort_keys=True, default=str))
    entry1 = LedgerEntry(
        id=uuid4(),
        event_type="EVENT_1",
        payload_json=payload1,
        previous_hash=GENESIS_HASH,
        entry_hash=hash1,
    )

    # Broken previous_hash
    payload2 = {"action": "TAMPERED"}
    entry2 = LedgerEntry(
        id=uuid4(),
        event_type="EVENT_2",
        payload_json=payload2,
        previous_hash="wrong_hash_" + "0" * 53,
        entry_hash=hash1,
    )

    db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [entry1, entry2]
    db.execute = AsyncMock(return_value=mock_res)

    is_valid, count, err = await verify_ledger_chain(db)
    assert is_valid is False
    assert count == 1
    assert "Broken chain" in (err or "")


@pytest.mark.asyncio
async def test_append_ledger_records_entry() -> None:
    db = AsyncMock()
    db.add = MagicMock()
    db.bind = None
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=mock_res)
    db.flush = AsyncMock()

    payload = {"booking_id": "test-123", "amount": "100.00"}
    entry = await append_ledger(
        db,
        event_type="TEST_EVENT",
        payload=payload,
        amount=Decimal("100.00"),
        currency="USD",
    )

    assert entry.previous_hash == GENESIS_HASH
    expected_hash = append_ledger_hash(
        GENESIS_HASH, json.dumps(payload, sort_keys=True, default=str)
    )
    assert entry.entry_hash == expected_hash
    db.add.assert_called_once_with(entry)
    db.flush.assert_awaited_once()
