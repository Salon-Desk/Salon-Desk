from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession, PlatformAdmin, PlatformAdminOnly
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.pagination import paginate_items
from app.schemas.common import PageOut
from app.schemas.ledger import (
    GenerateCommissionInvoiceRequest,
    OrgCommissionInvoiceOut,
)
from app.services import commission_billing_service

router = APIRouter(prefix="/admin", tags=["platform"])


@router.get("/commission-invoices", response_model=PageOut[OrgCommissionInvoiceOut])
async def list_commission_invoices(
    user: PlatformAdmin,
    db: DbSession,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    status: str | None = Query(default=None, description="Filter by status"),
    org_id: UUID | None = Query(default=None, description="Filter by organization"),
    q: str | None = Query(default=None, description="Search query"),
) -> PageOut[OrgCommissionInvoiceOut]:
    _ = user
    rows = await commission_billing_service.list_all_invoices(db, status=status, org_id=org_id, q=q)
    items = [OrgCommissionInvoiceOut.model_validate(r) for r in rows]
    return paginate_items(items, page=page, page_size=page_size)


@router.post(
    "/commission-invoices",
    response_model=OrgCommissionInvoiceOut,
    status_code=status.HTTP_201_CREATED,
)
async def generate_commission_invoice(
    body: GenerateCommissionInvoiceRequest,
    user: PlatformAdminOnly,
    db: DbSession,
) -> OrgCommissionInvoiceOut:
    _ = user
    try:
        invoice = await commission_billing_service.generate_invoice(
            db,
            org_id=body.org_id,
            period_start=body.period_start,
            period_end=body.period_end,
            due_date=body.due_date,
            currency=body.currency,
        )
    except ForbiddenError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc
    return OrgCommissionInvoiceOut.model_validate(invoice)


@router.post(
    "/commission-invoices/{invoice_id}/issue",
    response_model=OrgCommissionInvoiceOut,
)
async def issue_commission_invoice(
    invoice_id: UUID,
    user: PlatformAdminOnly,
    db: DbSession,
) -> OrgCommissionInvoiceOut:
    _ = user
    try:
        invoice = await commission_billing_service.issue_invoice(db, invoice_id=invoice_id)
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return OrgCommissionInvoiceOut.model_validate(invoice)


@router.post(
    "/commission-invoices/{invoice_id}/void",
    response_model=OrgCommissionInvoiceOut,
)
async def void_commission_invoice(
    invoice_id: UUID,
    user: PlatformAdminOnly,
    db: DbSession,
) -> OrgCommissionInvoiceOut:
    _ = user
    try:
        invoice = await commission_billing_service.void_invoice(db, invoice_id=invoice_id)
    except (ForbiddenError, NotFoundError) as exc:
        code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(exc, ForbiddenError)
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(code, detail=exc.message) from exc
    return OrgCommissionInvoiceOut.model_validate(invoice)
