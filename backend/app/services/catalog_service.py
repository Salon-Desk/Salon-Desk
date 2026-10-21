"""Catalog service for marketplace browsing, searching, and curation."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.enums import OrganizationStatus, OrgCancellationPolicyStatus
from app.models.organization import Organization
from app.models.policy import OrgCancellationPolicy
from app.schemas.common import PageOut
from app.schemas.feedback import CatalogStaffOut, ClientFeedbackOut, OrgFeedbackSummaryOut
from app.schemas.organization import CatalogCancellationPolicyOut, CatalogOrganizationOut
from app.services import feedback_service
from app.services.catalog_hero import get_catalog_curation, get_catalog_hero
from app.services.catalog_listings import (
    get_service,
    list_categories,
    list_organizations,
    list_services,
)
from app.services.catalog_mapping import organization_to_out, service_to_out

__all__ = [
    "CatalogCancellationPolicyOut",
    "get_catalog_curation",
    "get_catalog_hero",
    "get_organization",
    "get_organization_cancellation_policy",
    "get_organization_feedback_summary",
    "get_service",
    "list_categories",
    "list_organization_feedback",
    "list_organization_staff",
    "list_organizations",
    "list_services",
    "organization_to_out",
    "service_to_out",
]


async def get_organization(db: AsyncSession, org_id: UUID) -> CatalogOrganizationOut:
    result = await db.execute(
        select(Organization)
        .options(selectinload(Organization.settings))
        .where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()
    if org is None or org.status != OrganizationStatus.APPROVED:
        raise NotFoundError("Organization not found")
    rating_avg, review_count = await feedback_service.org_feedback_summary(db, org.id)
    return organization_to_out(org, org.settings, rating_avg, review_count)


async def list_organization_staff(db: AsyncSession, org_id: UUID) -> PageOut[CatalogStaffOut]:
    rows = await feedback_service.list_catalog_staff(db, org_id)
    items = [CatalogStaffOut.model_validate(row) for row in rows]
    total = len(items)
    return PageOut(items=items, page=1, page_size=max(total, 1), total=total, has_more=False)


async def get_organization_feedback_summary(
    db: AsyncSession, org_id: UUID
) -> OrgFeedbackSummaryOut:
    rating_avg, review_count = await feedback_service.org_feedback_summary(db, org_id)
    return OrgFeedbackSummaryOut(org_id=org_id, rating_avg=rating_avg, review_count=review_count)


async def list_organization_feedback(
    db: AsyncSession,
    org_id: UUID,
    stylist_id: UUID | None = None,
    page_size: int = 12,
) -> PageOut[ClientFeedbackOut]:
    rows = await feedback_service.list_public_feedback(
        db, org_id=org_id, stylist_id=stylist_id, limit=page_size
    )
    items: list[ClientFeedbackOut] = []
    for row in rows:
        service_name = None
        if row.booking and row.booking.booking_services:
            bs = row.booking.booking_services[0]
            if getattr(bs, "service", None):
                service_name = bs.service.name
        items.append(
            ClientFeedbackOut.model_validate(
                feedback_service.feedback_to_out(row, service_name=service_name)
            )
        )
    total = len(items)
    return PageOut(items=items, page=1, page_size=page_size, total=total, has_more=False)


async def get_organization_cancellation_policy(
    db: AsyncSession, org_id: UUID
) -> CatalogCancellationPolicyOut:
    org = await db.get(Organization, org_id)
    if org is None or org.status != OrganizationStatus.APPROVED:
        raise NotFoundError("Organization not found")

    result = await db.execute(
        select(OrgCancellationPolicy).where(
            OrgCancellationPolicy.org_id == org_id,
            OrgCancellationPolicy.status == OrgCancellationPolicyStatus.ACTIVE,
        )
    )
    policy = result.scalar_one_or_none()
    data = dict(policy.data or {}) if policy is not None else {}
    return CatalogCancellationPolicyOut(
        org_id=org_id,
        name=policy.name if policy is not None else "Default",
        free_cancel_hours=float(data.get("free_cancel_hours", 24)),
        no_show_fee_percent=float(data.get("no_show_fee_percent", 50)),
        late_cancel_fee_percent=(
            float(data["late_cancel_fee_percent"])
            if data.get("late_cancel_fee_percent") is not None
            else None
        ),
        data=data,
    )
