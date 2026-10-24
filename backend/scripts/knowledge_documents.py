"""Turn live catalog rows into knowledge-chunk documents for the semantic index."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import (
    FeedbackModerationStatus,
    KnowledgeEntityType,
    OrganizationStatus,
    OrgCancellationPolicyStatus,
    ServiceStatus,
    UserRole,
    UserStatus,
)
from app.models.feedback import ClientFeedback
from app.models.organization import Organization, OrgSettings
from app.models.policy import OrgCancellationPolicy
from app.models.service import Service, ServiceCategory
from app.models.user import User

PLATFORM_POLICY_DOCUMENTS: tuple[dict, ...] = (
    {
        "title": "SalonDesk Privacy Policy & Data Protection",
        "content": (
            "Privacy Policy: SalonDesk prioritizes data security and user privacy. "
            "Payment credentials, card numbers, and banking details are processed exclusively through PayPal's "
            "PCI-DSS compliant infrastructure and are never stored on SalonDesk servers. "
            "Client personal information (name, phone number, email) is collected solely for booking coordination "
            "and appointment reminders with the booked salon. We do not sell personal data to third parties. "
            "Users may request data access or account deletion at any time in their profile settings."
        ),
        "metadata_json": {"topic": "privacy_policy", "category": "legal"},
    },
    {
        "title": "SalonDesk Terms of Service & Agreement",
        "content": (
            "Terms of Service & Platform Agreement: Governs all use of the SalonDesk booking platform. "
            "Clients agree to provide accurate contact information and attend confirmed bookings on time. "
            "Salons agree to honor scheduled services at stated prices and comply with cancellation terms. "
            "SalonDesk provides the booking and software management infrastructure and does not directly employ "
            "stylists or provide salon services. Service disputes or rescheduling requests are handled between the client and salon."
        ),
        "metadata_json": {"topic": "terms_of_service", "category": "legal"},
    },
    {
        "title": "PayPal Authorization Hold Policy & Lifecycle",
        "content": (
            "PayPal Authorization Hold Policy: All client bookings place a $0 upfront authorization hold on the client's "
            "selected PayPal payment method. Funds are not deducted upfront. The authorization reserves the required amount. "
            "Upon service completion, the salon captures 100% of the service price directly into its verified PayPal merchant account. "
            "If the client cancels before the free cancellation deadline, 100% of the hold is voided and released ($0 charged). "
            "In case of a late cancellation or no-show, the agreed penalty fee is captured and the remaining hold is released. "
            "Holds older than 3 days undergo automatic re-authorization to maintain the payment honor window."
        ),
        "metadata_json": {"topic": "paypal_hold", "category": "payments"},
    },
    {
        "title": "Client Booking Consent Agreement",
        "content": (
            "Client Booking Consent & Authorization Terms: During checkout, clients explicitly agree to: "
            "'I authorize a PayPal hold for this booking under the salon cancellation policy.' "
            "This agreement is cryptographically signed and stored with a timestamp and a snapshot of the salon's "
            "active cancellation policy, ensuring transparent and legally enforceable hold authorization."
        ),
        "metadata_json": {"topic": "consent_terms", "category": "legal"},
    },
)


def _document(
    entity_type: KnowledgeEntityType,
    entity_id,
    org_id,
    title: str,
    content: str,
    metadata: dict,
) -> dict:
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "org_id": org_id,
        "title": title,
        "content": content,
        "metadata_json": metadata,
    }


def service_document(service: Service, settings: OrgSettings | None) -> tuple[str, str, dict]:
    org = service.organization
    category = service.category
    address = settings.physical_address if settings else None
    title = f"{service.name} — {org.name if org else 'Salon'}"
    parts = [
        service.name,
        org.name if org else "",
        category.name if category else "",
        service.description or "",
        f"price {service.base_price}",
        f"{service.duration_minutes} minutes",
        address or "",
    ]
    content = " | ".join(p for p in parts if p)
    meta = {
        "service_id": str(service.id),
        "organization_id": str(service.organization_id),
        "organization_name": org.name if org else None,
        "category_name": category.name if category else None,
        "base_price": str(service.base_price),
        "duration_minutes": service.duration_minutes,
        "physical_address": address,
    }
    return title, content, meta


def _org_by_id(orgs: list[Organization], org_id) -> Organization | None:
    return next((org for org in orgs if org.id == org_id), None)


async def category_documents(session: AsyncSession) -> list[dict]:
    result = await session.execute(select(ServiceCategory))
    items = []
    for cat in result.scalars().all():
        content = f"Service category: {cat.name}. {cat.description or ''}".strip()
        items.append(
            _document(
                KnowledgeEntityType.CATEGORY,
                cat.id,
                None,
                cat.name,
                content,
                {"category_id": str(cat.id)},
            )
        )
    return items


async def load_approved_organizations(
    session: AsyncSession,
) -> tuple[list[Organization], dict[uuid.UUID, OrgSettings]]:
    org_result = await session.execute(
        select(Organization).where(Organization.status == OrganizationStatus.APPROVED)
    )
    orgs = list(org_result.scalars().all())
    settings_map: dict[uuid.UUID, OrgSettings] = {}
    if orgs:
        settings_result = await session.execute(
            select(OrgSettings).where(OrgSettings.org_id.in_([org.id for org in orgs]))
        )
        settings_map = {settings.org_id: settings for settings in settings_result.scalars().all()}
    return orgs, settings_map


def organization_documents(
    orgs: list[Organization],
    settings_map: dict[uuid.UUID, OrgSettings],
) -> list[dict]:
    items = []
    for org in orgs:
        settings = settings_map.get(org.id)
        content = " | ".join(
            part
            for part in [
                org.name,
                org.description or "",
                settings.physical_address if settings else "",
                settings.timezone if settings else "",
            ]
            if part
        )
        items.append(
            _document(
                KnowledgeEntityType.ORGANIZATION,
                org.id,
                org.id,
                org.name,
                content,
                {
                    "organization_id": str(org.id),
                    "physical_address": settings.physical_address if settings else None,
                    "timezone": settings.timezone if settings else None,
                    "lat": str(settings.lat) if settings and settings.lat is not None else None,
                    "lng": str(settings.lng) if settings and settings.lng is not None else None,
                },
            )
        )
    return items


async def service_documents(
    session: AsyncSession,
    settings_map: dict[uuid.UUID, OrgSettings],
) -> list[dict]:
    result = await session.execute(
        select(Service)
        .options(
            selectinload(Service.organization),
            selectinload(Service.category),
        )
        .where(Service.status == ServiceStatus.ACTIVE)
    )
    items = []
    for service in result.scalars().all():
        org = service.organization
        if org is None or org.status != OrganizationStatus.APPROVED:
            continue
        title, content, meta = service_document(service, settings_map.get(service.organization_id))
        items.append(
            _document(
                KnowledgeEntityType.SERVICE,
                service.id,
                service.organization_id,
                title,
                content,
                meta,
            )
        )
    return items


async def policy_documents(session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(OrgCancellationPolicy).where(
            OrgCancellationPolicy.status == OrgCancellationPolicyStatus.ACTIVE
        )
    )
    items = []
    for policy in result.scalars().all():
        data = policy.data or {}
        free_hours = data.get("free_cancel_hours", 24)
        late_fee = data.get("late_cancel_fee_percent", 25)
        no_show_fee = data.get("no_show_fee_percent", 50)
        readable_desc = (
            f"Cancellation and No-Show Policy ({policy.name}): "
            f"Free cancellation is allowed up to {free_hours} hours prior to the appointment with 100% hold release ($0 charged). "
            f"Late cancellation after the {free_hours}-hour deadline incurs an agreed {late_fee}% fee of the service price. "
            f"No-show without notice incurs an agreed {no_show_fee}% fee of the service price. "
            f"All fee captures settle directly into the salon's verified PayPal merchant account."
        )
        items.append(
            _document(
                KnowledgeEntityType.POLICY,
                policy.id,
                policy.org_id,
                f"Cancellation Policy — {policy.name}",
                readable_desc,
                {"policy_id": str(policy.id), "data": policy.data},
            )
        )
    return items


def platform_policy_documents() -> list[dict]:
    return [
        _document(
            KnowledgeEntityType.PLATFORM,
            None,
            None,
            item["title"],
            item["content"],
            item["metadata_json"],
        )
        for item in PLATFORM_POLICY_DOCUMENTS
    ]


async def staff_documents(session: AsyncSession, orgs: list[Organization]) -> list[dict]:
    result = await session.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(
            User.role.in_([UserRole.STYLIST, UserRole.ORG_OWNER, UserRole.RECEPTION]),
            User.status == UserStatus.ACTIVE,
        )
    )
    items = []
    for staff in result.scalars().all():
        if not staff.org_id:
            continue
        org = _org_by_id(orgs, staff.org_id)
        first_name = staff.profile.first_name if staff.profile else ""
        last_name = staff.profile.last_name if staff.profile else ""
        full_name = f"{first_name} {last_name}".strip() or staff.email
        items.append(
            _document(
                KnowledgeEntityType.ORGANIZATION,
                staff.id,
                staff.org_id,
                f"Staff Member — {full_name}",
                (
                    f"Staff member {full_name} at {org.name if org else 'salon'}. "
                    f"Role: {staff.role.value}. Email: {staff.email}."
                ),
                {"staff_id": str(staff.id), "role": staff.role.value},
            )
        )
    return items


async def review_documents(session: AsyncSession, orgs: list[Organization]) -> list[dict]:
    result = await session.execute(
        select(ClientFeedback).where(ClientFeedback.status == FeedbackModerationStatus.APPROVED)
    )
    items = []
    for feedback in result.scalars().all():
        org = _org_by_id(orgs, feedback.org_id)
        items.append(
            _document(
                KnowledgeEntityType.ORGANIZATION,
                feedback.id,
                feedback.org_id,
                f"Client Review — {org.name if org else 'Salon'} ({feedback.rating} Stars)",
                (
                    f"Client review for {org.name if org else 'salon'}: rating {feedback.rating} out of 5 stars. "
                    f"Comment: {feedback.comment or 'Great service and experience.'}"
                ),
                {"feedback_id": str(feedback.id), "rating": feedback.rating},
            )
        )
    return items
