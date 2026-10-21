"""Platform analytics and dashboard metrics service."""

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ChangeRequestStatus, OrganizationStatus
from app.models.ledger import LedgerEntry
from app.models.organization import Organization
from app.models.policy import ChangeRequest
from app.schemas.platform import AdminDashboardOut
from app.services import feedback_service


async def get_admin_dashboard(db: AsyncSession) -> AdminDashboardOut:
    total = (await db.execute(select(func.count()).select_from(Organization))).scalar_one()
    pending = (
        await db.execute(
            select(func.count())
            .select_from(Organization)
            .where(Organization.status == OrganizationStatus.PENDING)
        )
    ).scalar_one()
    approved = (
        await db.execute(
            select(func.count())
            .select_from(Organization)
            .where(Organization.status == OrganizationStatus.APPROVED)
        )
    ).scalar_one()
    suspended = (
        await db.execute(
            select(func.count())
            .select_from(Organization)
            .where(Organization.status == OrganizationStatus.SUSPENDED)
        )
    ).scalar_one()
    pending_cr = (
        await db.execute(
            select(func.count())
            .select_from(ChangeRequest)
            .where(ChangeRequest.status == ChangeRequestStatus.PENDING)
        )
    ).scalar_one()
    ledger_count = (await db.execute(select(func.count()).select_from(LedgerEntry))).scalar_one()
    ledger_sum = (
        await db.execute(select(func.coalesce(func.sum(LedgerEntry.amount), 0)))
    ).scalar_one()
    pending_feedback = await feedback_service.count_pending_feedback(db)
    return AdminDashboardOut(
        total_organizations=int(total),
        pending_organizations=int(pending),
        approved_organizations=int(approved),
        suspended_organizations=int(suspended),
        pending_change_requests=int(pending_cr),
        pending_client_feedback=pending_feedback,
        ledger_entry_count=int(ledger_count),
        ledger_amount_sum=Decimal(str(ledger_sum)),
    )
