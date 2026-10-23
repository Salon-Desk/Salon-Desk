"""Lookup tools for salon and service details."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.enums import ServiceStatus
from app.models.service import Service

from .booking_helpers import resolve_organization, resolve_service
from .booking_responses import (
    error_response,
    organization_details_response,
    service_details_response,
)


def build_lookup_tools(
    session_factory: async_sessionmaker[AsyncSession],
    function_tool,
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

            svc_res = await db.execute(
                select(Service)
                .where(
                    Service.organization_id == org.id,
                    Service.status == ServiceStatus.ACTIVE,
                )
                .limit(5)
            )
            services = list(svc_res.scalars().all())

            org_data = {
                "id": str(org.id),
                "name": org.name,
                "description": org.description,
                "status": org.status.value,
            }
            services_data = [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "base_price": str(s.base_price),
                    "duration_minutes": s.duration_minutes,
                }
                for s in services
            ]
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
            }
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
