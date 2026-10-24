"""Read-only table and booking tools for merchant and admin assistants."""

from __future__ import annotations

import json
import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload

from app.models.booking import Booking
from app.models.enums import BookingStatus, OrganizationStatus, ServiceStatus
from app.models.organization import Organization
from app.models.service import Service
from app.models.user import User

logger = logging.getLogger("salondesk.ai.merchant_tools")

_ALLOWED_TABLES = {
    "bookings": Booking,
    "services": Service,
    "organizations": Organization,
    "users": User,
}

_BOOKING_STATUSES = "PENDING, CONFIRMED, COMPLETED, NO_SHOW, CANCELLED, REAUTHORIZED"


def _error(message: str) -> str:
    return json.dumps({"status": "error", "message": message})


def build_merchant_read_tools(
    session_factory: async_sessionmaker[AsyncSession],
    function_tool,
) -> list:
    """Return tools that read bookings and other allowed tables."""

    @function_tool()
    async def read_table(
        table_name: str,
        filter_condition: str | None = None,
        limit: int = 10,
    ) -> str:
        """Read data from a specific database table for inspection.

        Supported tables: bookings, services, organizations, users, staff.
        Optional filter_condition: SQL WHERE clause (use with caution).
        """
        table_key = table_name.lower().strip()
        model_class = _ALLOWED_TABLES.get(table_key)

        if not model_class:
            return _error(
                f"Table '{table_name}' not accessible. "
                f"Available tables: {', '.join(_ALLOWED_TABLES.keys())}"
            )

        try:
            async with session_factory() as db:
                stmt = select(model_class).limit(limit)

                # Apply basic filters if specified (sanitized)
                if filter_condition and "status" in filter_condition.lower():
                    try:
                        status_value = filter_condition.split("=")[1].strip().strip("'\"")
                        if table_key == "bookings":
                            stmt = stmt.where(Booking.status == BookingStatus(status_value.upper()))
                        elif table_key == "services":
                            stmt = stmt.where(Service.status == ServiceStatus(status_value.upper()))
                        elif table_key == "organizations":
                            stmt = stmt.where(
                                Organization.status == OrganizationStatus(status_value.lower())
                            )
                    except Exception:
                        pass  # Fall back to no filter

                res = await db.execute(stmt)
                items = list(res.scalars().all())

                result_data = []
                for item in items:
                    item_dict = {}
                    for col in item.__table__.columns:
                        val = getattr(item, col.name)
                        if val is not None:
                            item_dict[col.name] = str(val)
                    result_data.append(item_dict)

                return json.dumps(
                    {
                        "status": "success",
                        "table": table_name,
                        "count": len(result_data),
                        "data": result_data,
                    }
                )
        except Exception as exc:
            logger.error("Failed to read table %s: %s", table_name, exc)
            return _error(f"Failed to read table: {exc}")

    @function_tool()
    async def filter_bookings(
        status: str | None = None,
        org_id: str | None = None,
        limit: int = 10,
    ) -> str:
        """Filter bookings by status or organization.

        Status options: PENDING, CONFIRMED, COMPLETED, NO_SHOW, CANCELLED, REAUTHORIZED.
        """
        async with session_factory() as db:
            stmt = select(Booking).options(selectinload(Booking.organization))

            if status:
                try:
                    stmt = stmt.where(Booking.status == BookingStatus(status.upper()))
                except ValueError:
                    return _error(f"Invalid status: {status}. Valid: {_BOOKING_STATUSES}")

            if org_id:
                try:
                    stmt = stmt.where(Booking.organization_id == UUID(org_id))
                except ValueError:
                    return _error(f"Invalid org_id format: {org_id}")

            stmt = stmt.order_by(Booking.created_at.desc()).limit(limit)
            res = await db.execute(stmt)
            bookings = list(res.scalars().all())

            booking_data = [
                {
                    "id": str(b.id),
                    "status": b.status.value,
                    "starts_at": b.starts_at.isoformat(),
                    "agreed_hold_amount": str(b.agreed_hold_amount),
                    "organization_id": str(b.organization_id),
                    "organization_name": b.organization.name if b.organization else None,
                }
                for b in bookings
            ]

            return json.dumps(
                {
                    "status": "success",
                    "count": len(booking_data),
                    "bookings": booking_data,
                }
            )

    return [read_table, filter_bookings]
