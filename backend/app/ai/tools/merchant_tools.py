"""Merchant portal tools: navigation, UI interaction, and DB read access."""

from __future__ import annotations

import json
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload

from app.models.booking import Booking
from app.models.enums import BookingStatus, OrganizationStatus, ServiceStatus
from app.models.organization import Organization
from app.models.service import Service
from app.models.user import User

logger = logging.getLogger("salondesk.ai.merchant_tools")


def build_merchant_tools(
    session_factory: async_sessionmaker[AsyncSession],
) -> list:
    """Return LiveKit ``@function_tool`` callables for merchant/admin assistance."""
    try:
        from livekit.agents import function_tool
    except ImportError:  # pragma: no cover
        return []

    @function_tool()
    async def navigate_to_page(
        page_name: str,
    ) -> str:
        """Navigate to a specific page in the merchant/admin console.

        Supported pages: dashboard, calendar, appointments, staff, services, settings,
        profile, commission (admin only), salons (admin only), taxonomy (admin only),
        approvals (admin only), curation (admin only), staff (admin only).
        """
        page_map = {
            "dashboard": "/merchant",
            "calendar": "/merchant/calendar",
            "appointments": "/merchant/appointments",
            "staff": "/merchant/staff",
            "services": "/merchant/services",
            "settings": "/merchant/settings",
            "profile": "/merchant/profile",
            "commission": "/admin/commission",
            "salons": "/admin/salons",
            "taxonomy": "/admin/taxonomy",
            "approvals": "/admin/requests",
            "curation": "/admin/curation",
            "admin_staff": "/admin/staff",
        }

        page_key = page_name.lower().strip()
        target = page_map.get(page_key)

        if not target:
            return json.dumps(
                {
                    "status": "error",
                    "message": f"Unknown page: {page_name}. Available pages: {', '.join(page_map.keys())}",
                }
            )

        return json.dumps(
            {
                "status": "success",
                "action": "navigate",
                "target": target,
                "message": f"Navigating to {page_name}...",
            }
        )

    @function_tool()
    async def open_dialog(
        dialog_name: str,
    ) -> str:
        """Open a specific dialog or modal in the UI.

        Supported dialogs: add_staff, add_service, edit_service, change_paypal,
        request_policy, change_request_history, inspect_booking, settle_booking.
        """
        dialog_map = {
            "add_staff": "add_staff_modal",
            "add_service": "add_service_modal",
            "edit_service": "edit_service_modal",
            "change_paypal": "paypal_change_request_modal",
            "request_policy": "policy_change_request_modal",
            "change_request_history": "change_request_history_drawer",
            "inspect_booking": "booking_inspector_drawer",
            "settle_booking": "booking_settlement_drawer",
        }

        dialog_key = dialog_name.lower().strip()
        dialog_id = dialog_map.get(dialog_key)

        if not dialog_id:
            return json.dumps(
                {
                    "status": "error",
                    "message": f"Unknown dialog: {dialog_name}. Available dialogs: {', '.join(dialog_map.keys())}",
                }
            )

        return json.dumps(
            {
                "status": "success",
                "action": "open_dialog",
                "dialog_id": dialog_id,
                "message": f"Opening {dialog_name} dialog...",
            }
        )

    @function_tool()
    async def explain_field(
        field_name: str,
        context: str | None = None,
    ) -> str:
        """Explain the meaning of a form field or API response field.

        Provide the field name and optionally the context (page/form) for more specific explanation.
        """
        field_explanations = {
            # Booking fields
            "agreed_hold_amount": "The total amount of the PayPal authorization hold for this booking. This is the service price and is not charged upfront.",
            "free_cancel_deadline_at": "The deadline for free cancellation. If cancelled before this time, 100% of the hold is voided. After this, late cancel fees apply.",
            "agreed_late_cancel_fee": "The penalty fee that will be captured if the client cancels after the free cancellation deadline.",
            "status": "Current booking status: PENDING (awaiting hold), CONFIRMED (hold authorized), COMPLETED (show captured), NO_SHOW (penalty captured), CANCELLED (voided).",
            # Service fields
            "base_price": "The standard price for this service. This is the amount that will be held on the client's PayPal account.",
            "duration_minutes": "How long the service takes in minutes. Used for calendar scheduling and capacity planning.",
            "simultaneous_capacity": "Maximum number of clients that can be booked for this service at the same time.",
            # Organization fields
            "physical_address": "The physical location of the salon. Displayed to clients and used for nearby recommendations.",
            "timezone": "The salon's timezone. Critical for accurate calendar display and hold timing.",
            # Payment fields
            "paypal_merchant_id": "The PayPal merchant account ID where client captures settle. Must be approved by platform admin.",
            "currency": "The currency used for all transactions (e.g., USD). Must match the PayPal merchant account currency.",
            # Commission fields
            "commission_type": "How platform commission is calculated: percentage (of capture), flat (fixed amount), or hybrid (both).",
            "commission_rate": "The percentage or flat rate value for commission calculation.",
            # Staff fields
            "role": "User role: ORG_OWNER (full access), RECEPTION (front desk), STYLIST (service delivery), PLATFORM_ADMIN (platform operator).",
        }

        field_key = field_name.lower().strip().replace(" ", "_").replace("-", "_")
        explanation = field_explanations.get(field_key)

        if not explanation:
            return json.dumps(
                {
                    "status": "warning",
                    "message": f"No explanation available for field '{field_name}'. Common fields: {', '.join(list(field_explanations.keys())[:5])}",
                }
            )

        return json.dumps(
            {
                "status": "success",
                "field": field_name,
                "explanation": explanation,
                "context": context,
            }
        )

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
        allowed_tables = {
            "bookings": Booking,
            "services": Service,
            "organizations": Organization,
            "users": User,
        }

        table_key = table_name.lower().strip()
        model_class = allowed_tables.get(table_key)

        if not model_class:
            return json.dumps(
                {
                    "status": "error",
                    "message": f"Table '{table_name}' not accessible. Available tables: {', '.join(allowed_tables.keys())}",
                }
            )

        try:
            async with session_factory() as db:
                stmt = select(model_class).limit(limit)

                # Apply basic filters if specified (sanitized)
                if filter_condition and "status" in filter_condition.lower():
                    # Only allow very specific safe filters
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
                            # Convert to string for JSON serialization
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
            return json.dumps(
                {
                    "status": "error",
                    "message": f"Failed to read table: {exc}",
                }
            )

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
                    return json.dumps(
                        {
                            "status": "error",
                            "message": f"Invalid status: {status}. Valid: PENDING, CONFIRMED, COMPLETED, NO_SHOW, CANCELLED, REAUTHORIZED",
                        }
                    )

            if org_id:
                try:
                    from uuid import UUID

                    stmt = stmt.where(Booking.organization_id == UUID(org_id))
                except ValueError:
                    return json.dumps(
                        {
                            "status": "error",
                            "message": f"Invalid org_id format: {org_id}",
                        }
                    )

            stmt = stmt.order_by(Booking.created_at.desc()).limit(limit)
            res = await db.execute(stmt)
            bookings = list(res.scalars().all())

            booking_data = []
            for b in bookings:
                booking_data.append(
                    {
                        "id": str(b.id),
                        "status": b.status.value,
                        "starts_at": b.starts_at.isoformat(),
                        "agreed_hold_amount": str(b.agreed_hold_amount),
                        "organization_id": str(b.organization_id),
                        "organization_name": b.organization.name if b.organization else None,
                    }
                )

            return json.dumps(
                {
                    "status": "success",
                    "count": len(booking_data),
                    "bookings": booking_data,
                }
            )

    return [
        navigate_to_page,
        open_dialog,
        explain_field,
        read_table,
        filter_bookings,
    ]
