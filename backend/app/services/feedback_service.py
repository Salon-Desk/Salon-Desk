from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.booking import Booking, BookingService
from app.models.enums import (
    BookingStatus,
    FeedbackModerationStatus,
    OrganizationStatus,
    UserRole,
    UserStatus,
)
from app.models.feedback import ClientFeedback
from app.models.organization import Organization
from app.models.service import OrgEmployeeCategory, Service, ServiceCategory, ServiceGiving
from app.models.user import User

_APPROVED = FeedbackModerationStatus.APPROVED


def _display_name(user: User | None) -> str:
    if user is None:
        return "Client"
    profile = user.profile
    if profile is not None:
        name = f"{profile.first_name} {profile.last_name}".strip()
        if name:
            return name
    return user.email or "Client"


def _role_label(role: UserRole) -> str:
    if role == UserRole.STYLIST:
        return "Stylist"
    if role == UserRole.ORG_OWNER:
        return "Owner & stylist"
    if role == UserRole.RECEPTION:
        return "Front desk"
    return role.value.replace("_", " ").title()


def _approved_only():
    return ClientFeedback.status == _APPROVED


async def _stylist_specialties(
    db: AsyncSession, org_id: UUID, user_ids: list[UUID]
) -> dict[UUID, list[str]]:
    if not user_ids:
        return {}
    result = await db.execute(
        select(ServiceGiving.user_id, Service.name, ServiceCategory.name)
        .join(Service, Service.id == ServiceGiving.service_id)
        .join(ServiceCategory, ServiceCategory.id == Service.service_category_id)
        .where(
            Service.organization_id == org_id,
            ServiceGiving.user_id.in_(user_ids),
        )
    )
    specs: dict[UUID, set[str]] = {uid: set() for uid in user_ids}
    for user_id, service_name, category_name in result.all():
        if category_name:
            specs[user_id].add(str(category_name))
        elif service_name:
            specs[user_id].add(str(service_name))

    cat_result = await db.execute(
        select(OrgEmployeeCategory.user_id, ServiceCategory.name)
        .join(ServiceCategory, ServiceCategory.id == OrgEmployeeCategory.service_category_id)
        .where(OrgEmployeeCategory.user_id.in_(user_ids))
    )
    for user_id, category_name in cat_result.all():
        if category_name:
            specs[user_id].add(str(category_name))

    return {uid: sorted(names)[:5] for uid, names in specs.items()}


async def _rating_stats(
    db: AsyncSession,
    *,
    org_id: UUID,
    stylist_ids: list[UUID] | None = None,
) -> dict[UUID, tuple[float, int]]:
    stmt = (
        select(
            ClientFeedback.stylist_id,
            func.avg(ClientFeedback.rating),
            func.count(ClientFeedback.id),
        )
        .where(
            ClientFeedback.org_id == org_id,
            _approved_only(),
            ClientFeedback.stylist_id.is_not(None),
        )
        .group_by(ClientFeedback.stylist_id)
    )
    if stylist_ids is not None:
        stmt = stmt.where(ClientFeedback.stylist_id.in_(stylist_ids))
    result = await db.execute(stmt)
    stats: dict[UUID, tuple[float, int]] = {}
    for stylist_id, avg_rating, count in result.all():
        if stylist_id is None:
            continue
        avg = float(avg_rating or 0)
        stats[stylist_id] = (round(avg, 2), int(count or 0))
    return stats


async def list_catalog_staff(db: AsyncSession, org_id: UUID) -> list[dict]:
    org = await db.get(Organization, org_id)
    if org is None or org.status != OrganizationStatus.APPROVED:
        raise NotFoundError("Organization not found")

    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(
            User.org_id == org_id,
            User.status == UserStatus.ACTIVE,
            User.role == UserRole.STYLIST,
        )
        .order_by(User.created_at)
    )
    staff = list(result.scalars().all())
    ids = [u.id for u in staff]
    stats = await _rating_stats(db, org_id=org_id, stylist_ids=ids)
    specialties = await _stylist_specialties(db, org_id, ids)

    items: list[dict] = []
    for user in staff:
        avg, count = stats.get(user.id, (0.0, 0))
        items.append(
            {
                "id": user.id,
                "org_id": org_id,
                "role": _role_label(user.role),
                "display_name": _display_name(user),
                "picture": user.profile.picture if user.profile else None,
                "rating_avg": avg,
                "review_count": count,
                "specialties": specialties.get(user.id, []),
            }
        )
    return items


async def org_feedback_summary(db: AsyncSession, org_id: UUID) -> tuple[float, int]:
    result = await db.execute(
        select(func.avg(ClientFeedback.rating), func.count(ClientFeedback.id)).where(
            ClientFeedback.org_id == org_id,
            ClientFeedback.stylist_id.is_(None),
            _approved_only(),
        )
    )
    avg, count = result.one()
    return round(float(avg or 0), 2), int(count or 0)


async def list_public_feedback(
    db: AsyncSession,
    *,
    org_id: UUID,
    stylist_id: UUID | None = None,
    limit: int = 20,
) -> list[ClientFeedback]:
    org = await db.get(Organization, org_id)
    if org is None or org.status != OrganizationStatus.APPROVED:
        raise NotFoundError("Organization not found")

    stmt = (
        select(ClientFeedback)
        .options(
            selectinload(ClientFeedback.client).selectinload(User.profile),
            selectinload(ClientFeedback.stylist).selectinload(User.profile),
            selectinload(ClientFeedback.booking)
            .selectinload(Booking.booking_services)
            .selectinload(BookingService.service),
        )
        .where(ClientFeedback.org_id == org_id, _approved_only())
        .order_by(ClientFeedback.created_at.desc())
        .limit(limit)
    )
    if stylist_id is not None:
        stmt = stmt.where(ClientFeedback.stylist_id == stylist_id)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_client_feedback(
    db: AsyncSession,
    *,
    client_id: UUID,
) -> list[ClientFeedback]:
    result = await db.execute(
        select(ClientFeedback)
        .options(
            selectinload(ClientFeedback.organization),
            selectinload(ClientFeedback.stylist).selectinload(User.profile),
        )
        .where(ClientFeedback.client_id == client_id)
        .order_by(ClientFeedback.created_at.desc())
    )
    return list(result.scalars().all())


async def list_admin_feedback(
    db: AsyncSession,
    *,
    status: FeedbackModerationStatus | None = None,
) -> list[ClientFeedback]:
    stmt = (
        select(ClientFeedback)
        .options(
            selectinload(ClientFeedback.client).selectinload(User.profile),
            selectinload(ClientFeedback.stylist).selectinload(User.profile),
            selectinload(ClientFeedback.organization),
            selectinload(ClientFeedback.booking)
            .selectinload(Booking.booking_services)
            .selectinload(BookingService.service),
        )
        .order_by(ClientFeedback.created_at.desc())
    )
    if status is not None:
        stmt = stmt.where(ClientFeedback.status == status)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def count_pending_feedback(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(ClientFeedback)
        .where(ClientFeedback.status == FeedbackModerationStatus.PENDING)
    )
    return int(result.scalar_one() or 0)


async def moderate_feedback(
    db: AsyncSession,
    *,
    feedback_id: UUID,
    moderator_id: UUID,
    approve: bool,
    notes: str | None,
) -> ClientFeedback:
    feedback = await db.get(ClientFeedback, feedback_id)
    if feedback is None:
        raise NotFoundError("Feedback not found")
    if feedback.status != FeedbackModerationStatus.PENDING:
        raise ForbiddenError("Feedback was already moderated")

    feedback.status = (
        FeedbackModerationStatus.APPROVED if approve else FeedbackModerationStatus.REJECTED
    )
    feedback.moderated_by = moderator_id
    feedback.moderation_notes = notes
    feedback.moderated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(feedback)
    return feedback


async def create_client_feedback(
    db: AsyncSession,
    *,
    client_id: UUID,
    booking_id: UUID,
    rating: int,
    comment: str | None,
    stylist_id: UUID | None,
) -> ClientFeedback:
    booking = await db.execute(
        select(Booking)
        .options(selectinload(Booking.booking_services))
        .where(Booking.id == booking_id)
    )
    found = booking.scalar_one_or_none()
    if found is None:
        raise NotFoundError("Booking not found")
    if found.client_id != client_id:
        raise ForbiddenError("Not your booking")
    if found.status != BookingStatus.COMPLETED:
        raise ForbiddenError("Feedback is available only after your service is completed")

    if stylist_id is not None:
        if found.stylist_id != stylist_id:
            raise ForbiddenError("Stylist does not match this appointment")
        stylist = await db.get(User, stylist_id)
        if stylist is None or stylist.org_id != found.org_id:
            raise ForbiddenError("Invalid stylist for this salon")

    existing = await db.execute(
        select(ClientFeedback).where(
            ClientFeedback.booking_id == booking_id,
            ClientFeedback.stylist_id.is_(None)
            if stylist_id is None
            else ClientFeedback.stylist_id == stylist_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ForbiddenError("You already submitted feedback for this visit")

    row = ClientFeedback(
        booking_id=booking_id,
        client_id=client_id,
        org_id=found.org_id,
        stylist_id=stylist_id,
        rating=rating,
        comment=comment.strip() if comment else None,
        status=FeedbackModerationStatus.PENDING,
    )
    db.add(row)
    await db.commit()
    loaded = await db.execute(
        select(ClientFeedback)
        .options(
            selectinload(ClientFeedback.client).selectinload(User.profile),
            selectinload(ClientFeedback.stylist).selectinload(User.profile),
            selectinload(ClientFeedback.booking)
            .selectinload(Booking.booking_services)
            .selectinload(BookingService.service),
        )
        .where(ClientFeedback.id == row.id)
    )
    return loaded.scalar_one()


def feedback_to_out(
    feedback: ClientFeedback,
    *,
    service_name: str | None = None,
    organization_name: str | None = None,
    include_moderation: bool = False,
) -> dict:
    client_name = _display_name(getattr(feedback, "client", None))
    stylist_name = (
        _display_name(getattr(feedback, "stylist", None)) if feedback.stylist_id else None
    )
    org = getattr(feedback, "organization", None)
    org_name = organization_name or (org.name if org is not None else None)
    status = feedback.status.value if hasattr(feedback.status, "value") else str(feedback.status)
    payload = {
        "id": feedback.id,
        "booking_id": feedback.booking_id,
        "org_id": feedback.org_id,
        "organization_name": org_name,
        "stylist_id": feedback.stylist_id,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "status": status,
        "created_at": feedback.created_at,
        "client_name": client_name,
        "stylist_name": stylist_name,
        "service_name": service_name,
    }
    if include_moderation:
        payload["moderation_notes"] = feedback.moderation_notes
        payload["moderated_at"] = feedback.moderated_at
    return payload
