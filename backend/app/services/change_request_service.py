from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.change_request import ChangeRequest
from app.models.enums import (
    ChangeRequestStatus,
    ChangeRequestType,
    OrgAccountStatus,
    OrgCancellationPolicyStatus,
)
from app.models.organization import OrgAccount, OrgCancellationPolicy


async def submit_change_request(
    db: AsyncSession,
    *,
    org_id: UUID,
    submitted_by: UUID,
    request_type: str,
    payload_json: dict,
    current_snapshot_json: dict,
) -> ChangeRequest:
    try:
        rtype = ChangeRequestType(request_type)
    except ValueError as exc:
        raise ForbiddenError("Invalid request_type") from exc

    pending = await db.execute(
        select(ChangeRequest).where(
            ChangeRequest.org_id == org_id,
            ChangeRequest.request_type == rtype,
            ChangeRequest.status == ChangeRequestStatus.PENDING,
        )
    )
    if pending.scalar_one_or_none():
        raise ForbiddenError("A pending request of this type already exists")

    row = ChangeRequest(
        org_id=org_id,
        request_type=rtype,
        payload_json=payload_json,
        current_snapshot_json=current_snapshot_json,
        status=ChangeRequestStatus.PENDING,
        submitted_by=submitted_by,
    )
    db.add(row)
    await db.flush()
    return row


async def list_org_change_requests(db: AsyncSession, org_id: UUID) -> list[ChangeRequest]:
    result = await db.execute(
        select(ChangeRequest)
        .where(ChangeRequest.org_id == org_id)
        .order_by(ChangeRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def list_admin_change_requests(
    db: AsyncSession, status: ChangeRequestStatus | None = None
) -> list[ChangeRequest]:
    stmt = select(ChangeRequest).order_by(ChangeRequest.created_at.desc())
    if status is not None:
        stmt = stmt.where(ChangeRequest.status == status)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def _apply_approved(db: AsyncSession, request: ChangeRequest) -> None:
    payload = request.payload_json
    if request.request_type == ChangeRequestType.PAYPAL_ACCOUNT:
        existing = await db.execute(
            select(OrgAccount).where(
                OrgAccount.org_id == request.org_id,
                OrgAccount.status == OrgAccountStatus.APPROVED,
            )
        )
        current = existing.scalar_one_or_none()
        if current:
            current.status = OrgAccountStatus.SUSPENDED

        account = OrgAccount(
            org_id=request.org_id,
            merchant_id=payload["merchant_id"],
            merchant_email=payload.get("merchant_email"),
            display_name=payload.get("display_name") or payload["merchant_id"],
            currency=payload.get("currency", "USD"),
            status=OrgAccountStatus.APPROVED,
            approved_at=datetime.now(UTC),
            approved_by=request.reviewed_by,
        )
        db.add(account)

    elif request.request_type == ChangeRequestType.CANCELLATION_POLICY:
        # Archive active policies, activate new one from payload
        actives = await db.execute(
            select(OrgCancellationPolicy).where(
                OrgCancellationPolicy.org_id == request.org_id,
                OrgCancellationPolicy.status == OrgCancellationPolicyStatus.ACTIVE,
            )
        )
        for policy in actives.scalars().all():
            policy.status = OrgCancellationPolicyStatus.ARCHIVED

        policy_id = payload.get("policy_id")
        if policy_id:
            policy = await db.get(OrgCancellationPolicy, UUID(str(policy_id)))
            if policy and policy.org_id == request.org_id:
                if "data" in payload:
                    policy.data = payload["data"]
                if "name" in payload:
                    policy.name = payload["name"]
                policy.status = OrgCancellationPolicyStatus.ACTIVE
        else:
            db.add(
                OrgCancellationPolicy(
                    org_id=request.org_id,
                    name=payload.get("name", "Updated policy"),
                    status=OrgCancellationPolicyStatus.ACTIVE,
                    data=payload.get("data", {}),
                )
            )
    await db.flush()


async def review_change_request(
    db: AsyncSession,
    *,
    request_id: UUID,
    reviewer_id: UUID,
    approve: bool,
    review_notes: str | None = None,
) -> ChangeRequest:
    request = await db.get(ChangeRequest, request_id)
    if request is None:
        raise NotFoundError("Change request not found")
    if request.status != ChangeRequestStatus.PENDING:
        raise ForbiddenError("Change request already reviewed")

    request.reviewed_by = reviewer_id
    request.reviewed_at = datetime.now(UTC)
    request.review_notes = review_notes
    request.status = ChangeRequestStatus.APPROVED if approve else ChangeRequestStatus.REJECTED
    await db.flush()

    if approve:
        await _apply_approved(db, request)
    return request
