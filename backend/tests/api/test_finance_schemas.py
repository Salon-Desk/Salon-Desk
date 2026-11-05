from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.organization import (
    CancellationPolicyCreate,
    CancellationPolicyOut,
    ChangeRequestOut,
    OrgAccountCreate,
    OrgAccountOut,
)


def test_cancellation_policy_out_schema():
    policy_id = uuid4()
    org_id = uuid4()
    now = datetime.now(UTC)

    data = {
        "free_cancel_hours": 24,
        "no_show_fee_percent": 50,
        "late_cancel_fee_percent": 25,
        "hold_percent": 100,
    }

    out = CancellationPolicyOut(
        id=policy_id,
        org_id=org_id,
        name="Standard 24h Policy",
        status="active",
        data=data,
        org_name="Crown & Blade Atelier",
        created_at=now,
        updated_at=now,
    )

    dumped = out.model_dump()
    assert dumped["id"] == policy_id
    assert dumped["org_id"] == org_id
    assert dumped["org_name"] == "Crown & Blade Atelier"
    assert dumped["name"] == "Standard 24h Policy"
    assert dumped["status"] == "active"
    assert dumped["data"]["free_cancel_hours"] == 24
    assert dumped["data"]["no_show_fee_percent"] == 50
    assert dumped["data"]["late_cancel_fee_percent"] == 25
    assert dumped["created_at"] is not None


def test_org_account_out_schema():
    account_id = uuid4()
    org_id = uuid4()
    now = datetime.now(UTC)

    out = OrgAccountOut(
        id=account_id,
        org_id=org_id,
        merchant_id="PAYPAL-MERCHANT-123",
        merchant_email="finance@salondesk.local",
        display_name="Crown & Blade Payouts",
        currency="USD",
        status="approved",
        approved_at=now,
        org_name="Crown & Blade Atelier",
        created_at=now,
        updated_at=now,
    )

    dumped = out.model_dump()
    assert dumped["merchant_id"] == "PAYPAL-MERCHANT-123"
    assert dumped["org_name"] == "Crown & Blade Atelier"
    assert dumped["status"] == "approved"
    assert dumped["currency"] == "USD"


def test_change_request_out_schema():
    cr_id = uuid4()
    org_id = uuid4()
    user_id = uuid4()
    now = datetime.now(UTC)

    out = ChangeRequestOut(
        id=cr_id,
        org_id=org_id,
        request_type="CANCELLATION_POLICY",
        payload_json={"name": "Flexible 12h", "data": {"free_cancel_hours": 12}},
        current_snapshot_json={"data": {"free_cancel_hours": 24}},
        status="PENDING",
        submitted_by=user_id,
        created_at=now,
        org_name="Crown & Blade Atelier",
        submitter_name="Jane Doe",
    )

    dumped = out.model_dump()
    assert dumped["org_name"] == "Crown & Blade Atelier"
    assert dumped["submitter_name"] == "Jane Doe"
    assert dumped["payload_json"]["data"]["free_cancel_hours"] == 12
    assert dumped["current_snapshot_json"]["data"]["free_cancel_hours"] == 24


def test_cancellation_policy_create_schema():
    payload = CancellationPolicyCreate(
        name="Custom 48h Notice Policy",
        data={
            "free_cancel_hours": 48,
            "no_show_fee_percent": 100,
            "late_cancel_fee_percent": 50,
            "hold_percent": 100,
        },
    )
    dumped = payload.model_dump()
    assert dumped["name"] == "Custom 48h Notice Policy"
    assert dumped["data"]["free_cancel_hours"] == 48
    assert dumped["data"]["no_show_fee_percent"] == 100


def test_org_account_create_schema():
    payload = OrgAccountCreate(
        merchant_id="PAYPAL-DIRECT-ID",
        merchant_email="owner@salon.com",
        display_name="Direct Atelier",
        currency="USD",
    )
    dumped = payload.model_dump()
    assert dumped["merchant_id"] == "PAYPAL-DIRECT-ID"
    assert dumped["merchant_email"] == "owner@salon.com"
    assert dumped["display_name"] == "Direct Atelier"
    assert dumped["currency"] == "USD"
