"""Helper functions for booking tools - shared resolution and validation logic."""

from __future__ import annotations

import inspect
import logging
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking
from app.models.enums import OrganizationStatus, ServiceStatus, UserRole
from app.models.organization import Organization
from app.models.service import Service
from app.models.user import User

logger = logging.getLogger("salondesk.ai.booking_tools")


def parse_starts_at(preferred_time: str | None) -> datetime:
    """Parse appointment time or default to tomorrow at 2:00 PM UTC."""
    if preferred_time:
        try:
            dt = datetime.fromisoformat(preferred_time.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
            return dt
        except ValueError:
            pass

    # Default to tomorrow at 14:00 UTC
    tomorrow = datetime.now(UTC) + timedelta(days=1)
    return tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)


async def resolve_client(db: AsyncSession, client_email: str | None = None) -> User | None:
    """Resolve a client by email. Returns None if client_email is missing or not registered."""
    if client_email:
        res = await db.execute(
            select(User)
            .where(
                User.email == client_email.strip().lower(),
                User.role == UserRole.CLIENT,
            )
            .limit(1)
        )
        return res.scalar_one_or_none()
    return None


async def resolve_service(db: AsyncSession, service_query: str | None = None) -> Service | None:
    """Resolve a service by UUID or name, with fallback to any active service."""
    parsed_uuid: UUID | None = None
    try:
        parsed_uuid = UUID(service_query.strip()) if service_query else None
    except (ValueError, AttributeError):
        parsed_uuid = None

    query_clean = (service_query or "").strip()
    stmt = (
        select(Service)
        .join(Organization, Service.organization_id == Organization.id)
        .where(
            Organization.status == OrganizationStatus.APPROVED,
            Service.status == ServiceStatus.ACTIVE,
        )
    )
    if parsed_uuid:
        stmt = stmt.where(Service.id == parsed_uuid)
    elif query_clean:
        stmt = stmt.where(
            or_(
                Service.name.ilike(f"%{query_clean}%"),
                Organization.name.ilike(f"%{query_clean}%"),
            )
        )

    srv_res = await db.execute(stmt.limit(1))
    service = srv_res.scalar_one_or_none()

    if service is None:
        # Fallback to any active service
        any_srv = await db.execute(
            select(Service)
            .join(Organization, Service.organization_id == Organization.id)
            .where(
                Organization.status == OrganizationStatus.APPROVED,
                Service.status == ServiceStatus.ACTIVE,
            )
            .limit(1)
        )
        service = any_srv.scalar_one_or_none()

    return service


async def resolve_organization(
    db: AsyncSession, org_query: str | None = None
) -> Organization | None:
    """Resolve an organization by UUID or name."""
    parsed_uuid: UUID | None = None
    try:
        parsed_uuid = UUID(org_query.strip()) if org_query else None
    except (ValueError, AttributeError):
        parsed_uuid = None

    query_clean = (org_query or "").strip()
    stmt = select(Organization).where(Organization.status == OrganizationStatus.APPROVED)

    if parsed_uuid:
        stmt = stmt.where(Organization.id == parsed_uuid)
    elif query_clean:
        stmt = stmt.where(Organization.name.ilike(f"%{query_clean}%"))

    res = await db.execute(stmt.limit(1))
    return res.scalar_one_or_none()


async def get_organization_stylists(db: AsyncSession, org_id: UUID) -> list[dict]:
    """Get active stylists/staff for an organization."""
    try:
        from app.services import feedback_service

        return await feedback_service.list_catalog_staff(db, org_id)
    except Exception as exc:
        logger.warning("Could not list stylists for org %s: %s", org_id, exc)
        return []


async def resolve_stylist(
    db: AsyncSession,
    org_id: UUID,
    stylist_query: str | None = None,
) -> tuple[UUID | None, str]:
    """Resolve stylist by name or return (None, 'Any available stylist')."""
    if not stylist_query:
        return None, "Any available stylist"
    cleaned = stylist_query.strip().lower()
    if cleaned in (
        "any",
        "anyone",
        "any stylist",
        "any available",
        "any available stylist",
        "no preference",
        "none",
    ):
        return None, "Any available stylist"

    staff_list = await get_organization_stylists(db, org_id)
    for staff in staff_list:
        display = staff.get("display_name", "").lower()
        if cleaned in display or display in cleaned:
            return staff["id"], staff["display_name"]
    try:
        parsed_id = UUID(stylist_query.strip())
        for staff in staff_list:
            if staff["id"] == parsed_id:
                return staff["id"], staff["display_name"]
    except ValueError:
        pass
    return None, "Any available stylist"


def build_booking_payload(
    booking: Booking,
    service: Service,
    org: Organization | None,
    starts_at: datetime,
    stylist_name: str | None = None,
) -> dict[str, Any]:
    """Build a standardized booking payload for callbacks."""
    formatted_time = starts_at.strftime("%A, %b %d at %I:%M %p")
    org_name = org.name if org else "Salon"

    return {
        "type": "booking_confirmed",
        "booking_id": str(booking.id),
        "service_id": str(service.id),
        "service_name": service.name,
        "organization_name": org_name,
        "organization_id": str(service.organization_id),
        "stylist_name": stylist_name or "Any available stylist",
        "starts_at": starts_at.isoformat(),
        "formatted_time": formatted_time,
        "total_price": str(booking.total_price),
        "status": "CONFIRMED",
    }


def build_booking_data_dict(booking: Booking) -> dict[str, Any]:
    """Build booking data dict for client booking listings."""
    org = booking.organization
    svc_names = (
        ", ".join(bs.service.name for bs in booking.booking_services if bs.service)
        or "Salon service"
    )
    deadline_str = (
        booking.free_cancel_deadline_at.strftime("%b %d at %I:%M %p")
        if booking.free_cancel_deadline_at
        else "24h prior"
    )
    formatted_time = booking.starts_at.strftime("%A, %b %d at %I:%M %p")

    return {
        "booking_id": str(booking.id),
        "service_names": svc_names,
        "organization_name": org.name if org else "Salon",
        "starts_at": booking.starts_at.isoformat(),
        "formatted_time": formatted_time,
        "status": booking.status.value,
        "agreed_hold_amount": str(booking.agreed_hold_amount),
        "free_cancel_deadline": deadline_str,
        "late_cancel_fee": str(booking.agreed_late_cancel_fee),
        "can_cancel": booking.status.value in ("CONFIRMED", "PENDING", "REAUTHORIZED"),
    }


async def invoke_callback(
    callback: Callable[[dict[str, Any]], Any] | None,
    payload: dict[str, Any],
    *,
    log_label: str,
    silent: bool = False,
) -> None:
    """Run a booking tool callback, awaiting it when it returns a coroutine."""
    if callback is None:
        return
    try:
        result = callback(payload)
        if inspect.isawaitable(result):
            await result
    except Exception as exc:
        if not silent:
            logger.warning("%s callback failed: %s", log_label, exc)
