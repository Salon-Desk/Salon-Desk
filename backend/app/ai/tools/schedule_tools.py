"""Availability and schedule tools shared by chat and voice."""

from __future__ import annotations

import json
import logging
from collections.abc import Callable
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai.rag.utils import format_working_hours
from app.ai.tools.booking_helpers import resolve_organization, resolve_service
from app.ai.tools.booking_responses import error_response
from app.models.enums import ServiceStatus
from app.models.organization import OrgSettings
from app.models.service import Service
from app.services.availability_service import (
    check_slot_available,
    get_availability,
    resolve_org_timezone,
)

logger = logging.getLogger("salondesk.ai.schedule_tools")

__all__ = [
    "build_schedule_tools",
    "format_working_hours",
    "parse_query_date",
]

_WEEKDAY_NAMES = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
    "mon": 0,
    "tue": 1,
    "wed": 2,
    "thu": 3,
    "fri": 4,
    "sat": 5,
    "sun": 6,
}


def parse_query_date(day_str: str | None, tz: ZoneInfo) -> date:
    """Parse a requested day or relative day expression into a calendar date."""
    now_local = datetime.now(tz)
    if not day_str or not day_str.strip():
        return (now_local + timedelta(days=1)).date()

    cleaned = day_str.strip().lower()
    if cleaned in ("today", "now"):
        return now_local.date()
    if cleaned in ("tomorrow", "tmrw"):
        return (now_local + timedelta(days=1)).date()

    for name, weekday_num in _WEEKDAY_NAMES.items():
        if name in cleaned:
            days_ahead = (weekday_num - now_local.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7
            return (now_local + timedelta(days=days_ahead)).date()

    try:
        return date.fromisoformat(cleaned)
    except ValueError:
        pass

    try:
        from dateutil import parser

        parsed = parser.parse(cleaned)
        return parsed.date()
    except Exception:
        pass

    return (now_local + timedelta(days=1)).date()


def build_schedule_tools(
    session_factory: async_sessionmaker[AsyncSession],
    function_tool: Any = None,
    on_discovery_results: Callable[[dict[str, Any]], Any] | None = None,
) -> list:
    """Return tools that query live schedule, openings, and working hours from the database."""
    if function_tool is None:
        try:
            from livekit.agents import function_tool
        except ImportError:  # pragma: no cover
            return []

    @function_tool()
    async def get_available_slots(
        service_query: str,
        day: str | None = None,
        org_query: str | None = None,
    ) -> str:
        """Get live available booking time slots and working hours for a service or salon directly from database.

        Use this when a client asks what times or slots are open, asks if a specific time is available,
        or asks for openings today, tomorrow, or a specific date.

        Args:
            service_query: The name of the service (e.g. 'Haircut', 'Swedish Massage', 'Manicure').
            day: Optional date or day string (e.g. 'today', 'tomorrow', 'Friday', '2026-10-25'). Defaults to 'tomorrow'.
            org_query: Optional salon name if known.
        """
        async with session_factory() as db:
            service = await resolve_service(db, service_query)
            if not service and org_query:
                org = await resolve_organization(db, org_query)
                if org:
                    svc_res = await db.execute(
                        select(Service)
                        .where(
                            Service.organization_id == org.id,
                            Service.status == ServiceStatus.ACTIVE,
                        )
                        .limit(1)
                    )
                    service = svc_res.scalar_one_or_none()

            if not service:
                return error_response(f"Could not find a service matching '{service_query}'.")

            org = service.organization
            org_name = org.name if org else "Salon"

            settings_res = await db.execute(
                select(OrgSettings).where(OrgSettings.org_id == service.organization_id)
            )
            settings = settings_res.scalar_one_or_none()
            tz_str = settings.timezone if settings and settings.timezone else "UTC"
            org_tz = resolve_org_timezone(tz_str)

            target_date = parse_query_date(day, org_tz)

            try:
                avail = await get_availability(db, service_id=service.id, day=target_date)
            except Exception as exc:
                return error_response(f"Unable to look up schedule for {service.name}: {exc}")

            open_slots = [s for s in avail.slots if s.available]
            formatted_date = target_date.strftime("%A, %b %d")

            formatted_slots = [
                s.starts_at.astimezone(org_tz).strftime("%I:%M %p").lstrip("0") for s in open_slots
            ]

            if not avail.open_windows:
                return json.dumps(
                    {
                        "status": "closed",
                        "service_name": service.name,
                        "organization_name": org_name,
                        "date": target_date.isoformat(),
                        "formatted_date": formatted_date,
                        "timezone": tz_str,
                        "message": f"{org_name} is closed on {formatted_date}.",
                        "available_slots": [],
                    }
                )

            if not formatted_slots:
                return json.dumps(
                    {
                        "status": "fully_booked",
                        "service_name": service.name,
                        "organization_name": org_name,
                        "date": target_date.isoformat(),
                        "formatted_date": formatted_date,
                        "timezone": tz_str,
                        "message": f"{org_name} is fully booked for {service.name} on {formatted_date}.",
                        "available_slots": [],
                    }
                )

            return json.dumps(
                {
                    "status": "success",
                    "service_name": service.name,
                    "organization_name": org_name,
                    "date": target_date.isoformat(),
                    "formatted_date": formatted_date,
                    "timezone": tz_str,
                    "available_slots_count": len(formatted_slots),
                    "available_slots": formatted_slots,
                    "sample_slots": formatted_slots[:6],
                    "message": (
                        f"Available slots for {service.name} at {org_name} on {formatted_date} "
                        f"({tz_str}): {', '.join(formatted_slots[:6])}."
                    ),
                }
            )

    @function_tool()
    async def check_time_slot_available(
        service_query: str,
        time_expression: str,
        org_query: str | None = None,
    ) -> str:
        """Check if a specific time slot is available for a service.

        Use this when a client asks if a specific time is open (e.g. 'Can I book tomorrow at 2 PM?').

        Args:
            service_query: The name of the service (e.g. 'Haircut', 'Swedish Massage').
            time_expression: The requested date and time (e.g. 'tomorrow at 2 pm', 'Friday at 10 am').
            org_query: Optional salon name if known.
        """
        from app.ai.chat_booking import _parse_starts_at

        async with session_factory() as db:
            service = await resolve_service(db, service_query)
            if not service and org_query:
                org = await resolve_organization(db, org_query)
                if org:
                    svc_res = await db.execute(
                        select(Service)
                        .where(
                            Service.organization_id == org.id,
                            Service.status == ServiceStatus.ACTIVE,
                        )
                        .limit(1)
                    )
                    service = svc_res.scalar_one_or_none()

            if not service:
                return error_response(f"Could not find a service matching '{service_query}'.")

            org = service.organization
            org_name = org.name if org else "Salon"

            settings_res = await db.execute(
                select(OrgSettings).where(OrgSettings.org_id == service.organization_id)
            )
            settings = settings_res.scalar_one_or_none()
            tz_str = settings.timezone if settings and settings.timezone else "UTC"
            org_tz = resolve_org_timezone(tz_str)

            starts_at = _parse_starts_at(time_expression)
            if not starts_at:
                return error_response(
                    f"Could not parse the requested date and time '{time_expression}'. Please specify day and hour."
                )

            ends_at = starts_at + timedelta(minutes=service.duration_minutes)
            is_open = await check_slot_available(
                db, service=service, starts_at=starts_at, ends_at=ends_at
            )

            starts_local = starts_at.astimezone(org_tz)
            formatted_time = starts_local.strftime("%A, %b %d at %I:%M %p")

            if not is_open:
                # Provide alternative slots
                avail = await get_availability(db, service_id=service.id, day=starts_local.date())
                open_slots = [
                    s.starts_at.astimezone(org_tz).strftime("%I:%M %p").lstrip("0")
                    for s in avail.slots
                    if s.available
                ]
                return json.dumps(
                    {
                        "status": "unavailable",
                        "available": False,
                        "service_name": service.name,
                        "organization_name": org_name,
                        "requested_time": formatted_time,
                        "alternative_slots": open_slots[:5],
                        "message": (
                            f"{formatted_time} is not available for {service.name} at {org_name}. "
                            f"Other openings on that day: {', '.join(open_slots[:5]) if open_slots else 'None'}."
                        ),
                    }
                )

            return json.dumps(
                {
                    "status": "available",
                    "available": True,
                    "service_name": service.name,
                    "organization_name": org_name,
                    "requested_time": formatted_time,
                    "duration_minutes": service.duration_minutes,
                    "message": f"Yes, {formatted_time} is open and available for {service.name} at {org_name}!",
                }
            )

    return [get_available_slots, check_time_slot_available]
