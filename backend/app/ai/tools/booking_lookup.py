import inspect
from collections.abc import Callable
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload

from app.ai.rag.utils import format_working_hours
from app.models.enums import ServiceStatus
from app.models.organization import OrgSettings
from app.models.service import Service

from .booking_helpers import get_organization_stylists, resolve_organization, resolve_service
from .booking_responses import (
    error_response,
    organization_details_response,
    service_details_response,
)


def build_lookup_tools(
    session_factory: async_sessionmaker[AsyncSession],
    function_tool,
    on_discovery_results: Callable[[dict[str, Any]], Any] | None = None,
) -> list:
    """Return tools that describe a salon or a service."""

    @function_tool()
    async def get_organization_details(
        org_query: str,
    ) -> str:
        """Get detailed information about an organization/salon.

        Use this when the client asks for details about a specific salon.
        """
        async with session_factory() as db:
            org = await resolve_organization(db, org_query)
            if not org:
                return error_response(f"Could not find an organization matching '{org_query}'.")

            settings_res = await db.execute(select(OrgSettings).where(OrgSettings.org_id == org.id))
            settings = settings_res.scalar_one_or_none()
            tz = settings.timezone if settings and settings.timezone else "UTC"
            addr = settings.physical_address if settings else None
            wh_formatted = (
                format_working_hours(settings.working_hours)
                if settings and settings.working_hours
                else "Mon-Sat 9:00 AM - 6:00 PM"
            )

            staff_list = await get_organization_stylists(db, org.id)
            stylist_names = [s.get("display_name") for s in staff_list if s.get("display_name")]

            svc_res = await db.execute(
                select(Service)
                .options(selectinload(Service.category))
                .where(
                    Service.organization_id == org.id,
                    Service.status == ServiceStatus.ACTIVE,
                )
                .limit(10)
            )
            services = list(svc_res.scalars().all())

            org_data = {
                "id": str(org.id),
                "name": org.name,
                "description": org.description,
                "status": org.status.value,
                "physical_address": addr,
                "timezone": tz,
                "working_hours": wh_formatted,
                "stylists": stylist_names,
            }
            services_data = [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "base_price": str(s.base_price),
                    "duration_minutes": s.duration_minutes,
                    "category_name": s.category.name if s.category else None,
                    "description": s.description,
                }
                for s in services
            ]

            if on_discovery_results and services:
                rec_cards = [
                    {
                        "service_id": str(s.id),
                        "organization_id": str(org.id),
                        "name": s.name,
                        "organization_name": org.name,
                        "organization_picture": org.picture,
                        "image_url": (s.images or {}).get("cover"),
                        "base_price": str(s.base_price),
                        "duration_minutes": s.duration_minutes,
                        "category_name": s.category.name if s.category else None,
                        "description": s.description,
                        "physical_address": addr,
                    }
                    for s in services
                ]
                try:
                    res = on_discovery_results({"recommendations": rec_cards})
                    if inspect.isawaitable(res):
                        await res
                except Exception:
                    pass

            return organization_details_response(org_data, services_data)

    @function_tool()
    async def get_service_details(
        service_query: str,
    ) -> str:
        """Get detailed information about a service.

        Use this when the client asks for details about a specific service.
        """
        async with session_factory() as db:
            service = await resolve_service(db, service_query)
            if not service:
                return error_response(f"Could not find a service matching '{service_query}'.")

            org = service.organization
            settings = None
            if org:
                settings_res = await db.execute(
                    select(OrgSettings).where(OrgSettings.org_id == org.id)
                )
                settings = settings_res.scalar_one_or_none()

            service_data = {
                "id": str(service.id),
                "name": service.name,
                "description": service.description,
                "base_price": str(service.base_price),
                "duration_minutes": service.duration_minutes,
                "category_name": service.category.name if service.category else None,
            }
            org_data = {
                "id": str(org.id) if org else None,
                "name": org.name if org else None,
                "physical_address": (
                    settings.physical_address
                    if settings
                    else (org.physical_address if org else None)
                ),
                "timezone": settings.timezone if settings and settings.timezone else "UTC",
                "working_hours": (
                    format_working_hours(settings.working_hours)
                    if settings and settings.working_hours
                    else None
                ),
            }

            if on_discovery_results:
                rec_card = {
                    "service_id": str(service.id),
                    "organization_id": str(org.id) if org else "",
                    "name": service.name,
                    "organization_name": org.name if org else "Salon",
                    "organization_picture": org.picture if org else None,
                    "image_url": (service.images or {}).get("cover"),
                    "base_price": str(service.base_price),
                    "duration_minutes": service.duration_minutes,
                    "category_name": service.category.name if service.category else None,
                    "description": service.description,
                    "physical_address": settings.physical_address if settings else None,
                }
                try:
                    res = on_discovery_results({"recommendations": [rec_card]})
                    if inspect.isawaitable(res):
                        await res
                except Exception:
                    pass

            return service_details_response(service_data, org_data)

    @function_tool()
    async def get_salon_stylists(
        service_query: str | None = None,
        org_query: str | None = None,
    ) -> str:
        """Get the list of available stylists/staff for a salon or service.

        Use this when a client chooses a service and time, so you can ask them which
        stylist they prefer or offer 'Any available stylist'.
        """
        import json

        from .booking_helpers import get_organization_stylists

        async with session_factory() as db:
            org = None
            if org_query:
                org = await resolve_organization(db, org_query)
            elif service_query:
                service = await resolve_service(db, service_query)
                if service:
                    org = service.organization

            if not org:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Please specify the salon or service to look up stylists for.",
                        "stylists": ["Any available stylist"],
                    }
                )

            staff_list = await get_organization_stylists(db, org.id)
            stylist_names = [s.get("display_name") for s in staff_list if s.get("display_name")]
            options = stylist_names + ["Any available stylist"]

            if on_discovery_results:
                stylist_cards = [
                    {
                        "id": "any",
                        "name": "Any available stylist",
                        "organization_name": org.name,
                        "role": "Fastest appointment",
                        "is_any": True,
                    }
                ]
                for s in staff_list:
                    if s.get("display_name"):
                        stylist_cards.append(
                            {
                                "id": str(s["id"]),
                                "name": s["display_name"],
                                "organization_name": org.name,
                                "role": s.get("role") or "Stylist",
                                "picture": s.get("picture"),
                                "bio": ", ".join(s.get("specialties", []))
                                if s.get("specialties")
                                else None,
                                "rating": float(s.get("rating_avg", 0.0))
                                if s.get("rating_avg")
                                else None,
                                "is_any": False,
                            }
                        )
                try:
                    res = on_discovery_results({"stylists": stylist_cards})
                    if inspect.isawaitable(res):
                        await res
                except Exception:
                    pass

            return json.dumps(
                {
                    "status": "success",
                    "organization_name": org.name,
                    "stylists": options,
                    "message": (
                        f"Available stylists at {org.name}: {', '.join(stylist_names) if stylist_names else 'No individual stylists listed'}. "
                        "You can also choose 'Any available stylist'."
                    ),
                }
            )

    return [get_organization_details, get_service_details, get_salon_stylists]
