from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, OrgMember, OrgOwner
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.pagination import paginate_items
from app.models.payment import OrgAccount
from app.models.policy import OrgCancellationPolicy
from app.schemas.common import PageOut
from app.schemas.ledger import (
    CommissionRecordOut,
    OrgCommissionInvoiceOut,
    PayCommissionInvoiceRequest,
)
from app.schemas.organization import (
    CancellationPolicyOut,
    ChangeRequestCreate,
    ChangeRequestOut,
    OrgAccountOut,
)
from app.services import change_request_service, commission_billing_service

router = APIRouter(prefix="/organizations", tags=["org"])

# --- Policies / account / change requests ---


@router.get("/me/cancellation-policies", response_model=list[CancellationPolicyOut])
async def list_policies(user: OrgMember, db: DbSession) -> list[CancellationPolicyOut]:
    result = await db.execute(
        select(OrgCancellationPolicy)
        .options(selectinload(OrgCancellationPolicy.organization))
        .where(OrgCancellationPolicy.org_id == user.org_id)
        .order_by(OrgCancellationPolicy.created_at.desc())
    )
    return [CancellationPolicyOut.model_validate(p) for p in result.scalars().all()]


@router.get("/me/account", response_model=OrgAccountOut | None)
async def get_account(user: OrgMember, db: DbSession) -> OrgAccountOut | None:
    result = await db.execute(
        select(OrgAccount)
        .options(selectinload(OrgAccount.organization))
        .where(OrgAccount.org_id == user.org_id)
        .order_by(OrgAccount.created_at.desc())
        .limit(1)
    )
    account = result.scalar_one_or_none()
    return OrgAccountOut.model_validate(account) if account else None


@router.get("/me/change-requests", response_model=PageOut[ChangeRequestOut])
async def list_change_requests(
    user: OrgMember,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    q: str | None = Query(default=None, description="Search query"),
    status: str | None = Query(default=None, description="Filter by status"),
) -> PageOut[ChangeRequestOut]:
    assert user.org_id is not None
    rows = await change_request_service.list_org_change_requests(db, user.org_id)
    items = [ChangeRequestOut.model_validate(r) for r in rows]
    if status:
        sf = status.upper()
        items = [r for r in items if r.status.upper() == sf]
    if q and q.strip():
        term = q.strip().lower()
        items = [
            r
            for r in items
            if term in str(r.id).lower()
            or (r.type and term in r.type.lower())
            or (r.review_notes and term in r.review_notes.lower())
        ]
    return paginate_items(items, page=page, page_size=page_size)


@router.post(
    "/me/change-requests",
    response_model=ChangeRequestOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_change_request(
    body: ChangeRequestCreate, user: OrgOwner, db: DbSession
) -> ChangeRequestOut:
    assert user.org_id is not None
    try:
        row = await change_request_service.submit_change_request(
            db,
            org_id=user.org_id,
            submitted_by=user.id,
            request_type=body.request_type,
            payload_json=body.payload_json,
            current_snapshot_json=body.current_snapshot_json,
        )
    except ForbiddenError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc
    return ChangeRequestOut.model_validate(row)


# --- SaaS commission ledger / invoices ---


@router.get("/me/commission-records", response_model=PageOut[CommissionRecordOut])
async def list_commission_records(
    user: OrgMember,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    status: str | None = Query(default=None, description="Filter by status"),
) -> PageOut[CommissionRecordOut]:
    assert user.org_id is not None
    rows = await commission_billing_service.list_org_commission_records(
        db, user.org_id, status=status
    )
    items = [CommissionRecordOut.model_validate(r) for r in rows]
    return paginate_items(items, page=page, page_size=page_size)


@router.get("/me/commission-invoices", response_model=PageOut[OrgCommissionInvoiceOut])
async def list_commission_invoices(
    user: OrgMember,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    status: str | None = Query(default=None, description="Filter by status"),
) -> PageOut[OrgCommissionInvoiceOut]:
    assert user.org_id is not None
    rows = await commission_billing_service.list_org_invoices(db, user.org_id, status=status)
    items = [OrgCommissionInvoiceOut.model_validate(r) for r in rows]
    return paginate_items(items, page=page, page_size=page_size)


@router.post(
    "/me/commission-invoices/{invoice_id}/pay",
    response_model=OrgCommissionInvoiceOut,
)
async def pay_commission_invoice(
    invoice_id: UUID,
    user: OrgOwner,
    db: DbSession,
    body: PayCommissionInvoiceRequest | None = None,
) -> OrgCommissionInvoiceOut:
    assert user.org_id is not None
    try:
        invoice = await commission_billing_service.pay_invoice(
            db,
            invoice_id=invoice_id,
            org_id=user.org_id,
            paypal_invoice_or_order_id=body.paypal_invoice_or_order_id if body else None,
        )
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return OrgCommissionInvoiceOut.model_validate(invoice)
