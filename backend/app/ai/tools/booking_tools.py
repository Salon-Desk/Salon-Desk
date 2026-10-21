"""Booking draft/confirm tools shared by chat and voice."""

from __future__ import annotations

import inspect
import json
import logging
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload

from app.models.booking import Booking
from app.models.enums import BookingStatus, OrganizationStatus, ServiceStatus, UserRole
from app.models.organization import Organization
from app.models.service import Service
from app.models.user import User
from app.services import booking_service, payment_service

logger = logging.getLogger("salondesk.ai.booking_tools")


def _parse_starts_at(preferred_time: str | None) -> datetime:
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


def build_booking_tools(
    session_factory: async_sessionmaker[AsyncSession],
    on_booking_success: Callable[[dict[str, Any]], Any] | None = None,
    on_payment_link: Callable[[dict[str, Any]], Any] | None = None,
) -> list:
    """Return LiveKit ``@function_tool`` callables for voice/chat booking confirmation."""
    try:
        from livekit.agents import function_tool
    except ImportError:  # pragma: no cover
        return []

    @function_tool()
    async def book_and_confirm_appointment(
        service_query: str,
        preferred_time: str | None = None,
        client_email: str | None = None,
        notes: str | None = None,
    ) -> str:
        """Book and immediately confirm an appointment with a $0 PayPal authorization hold.

        Use this when the client confirms they want to book a service (e.g. 'book the haircut',
        'reserve an appointment tomorrow at 2pm').
        """
        async with session_factory() as db:
            # 1. Resolve client
            client: User | None = None
            if client_email:
                res = await db.execute(
                    select(User).where(User.email == client_email.strip().lower()).limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                # Default to demo client or first active client
                res = await db.execute(
                    select(User)
                    .where(User.email == "client@example.com", User.role == UserRole.CLIENT)
                    .limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                res = await db.execute(select(User).where(User.role == UserRole.CLIENT).limit(1))
                client = res.scalar_one_or_none()

            if client is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Please log in first before booking an appointment.",
                    }
                )

            # 2. Resolve service
            parsed_uuid: UUID | None = None
            try:
                parsed_uuid = UUID(service_query.strip())
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
            else:
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

            if service is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Could not find an active service matching '{service_query}'.",
                    }
                )

            starts_at = _parse_starts_at(preferred_time)

            # 3. Create booking
            try:
                booking = await booking_service.create_booking(
                    db,
                    client_id=client.id,
                    org_id=service.organization_id,
                    service_ids=[service.id],
                    starts_at=starts_at,
                    stylist_id=None,
                    customer_notes=notes or "Booked via SalonDesk AI Voice Assistant",
                )
            except Exception as exc:
                logger.warning("Failed to create booking: %s", exc)
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Could not book the appointment: {exc}",
                    }
                )

            # 4. Create consent and authorization hold to confirm booking
            try:
                terms = (
                    "I authorize a $0 PayPal authorization hold for this booking under the salon "
                    "cancellation policy. $0 is debited today; settlement occurs at the salon."
                )
                await payment_service.create_consent(
                    db,
                    booking=booking,
                    client_id=client.id,
                    terms_version="v1",
                    terms_text=terms,
                    signed_payload=f"booking={booking.id};client={client.id};auto_confirmed=true",
                )
                hold, _approval = await payment_service.create_hold(
                    db,
                    booking=booking,
                    idempotency_key=f"voice-hold-{booking.id}",
                    currency="USD",
                )
                # Voice channel auto-completes stub/sandbox authorize after order create.
                await payment_service.complete_hold(
                    db, hold=hold, paypal_order_token=hold.paypal_order_id
                )
                await db.commit()
            except Exception as exc:
                logger.error("Failed to confirm hold on booking %s: %s", booking.id, exc)
                return json.dumps(
                    {
                        "status": "partial",
                        "booking_id": str(booking.id),
                        "message": f"Appointment created, but authorization hold could not be placed: {exc}",
                    }
                )

            # 5. Notify callback
            org = await db.get(Organization, service.organization_id)
            org_name = org.name if org else "Salon"
            formatted_time = starts_at.strftime("%A, %b %d at %I:%M %p")

            payload = {
                "type": "booking_confirmed",
                "booking_id": str(booking.id),
                "service_id": str(service.id),
                "service_name": service.name,
                "organization_name": org_name,
                "organization_id": str(service.organization_id),
                "starts_at": starts_at.isoformat(),
                "formatted_time": formatted_time,
                "total_price": str(booking.total_price),
                "status": "CONFIRMED",
            }

            if on_booking_success:
                try:
                    res = on_booking_success(payload)
                    if inspect.isawaitable(res):
                        await res
                except Exception as exc:
                    logger.warning("on_booking_success callback failed: %s", exc)

            return json.dumps(
                {
                    "status": "success",
                    "booking_id": str(booking.id),
                    "status_code": "CONFIRMED",
                    "service_name": service.name,
                    "organization_name": org_name,
                    "time": formatted_time,
                    "total_price": str(booking.total_price),
                    "message": (
                        f"Your appointment for {service.name} at {org_name} has been booked and "
                        f"confirmed for {formatted_time}. A $0 PayPal authorization hold is active with free cancellation."
                    ),
                }
            )

    @function_tool()
    async def create_pending_booking_with_payment_link(
        service_query: str,
        preferred_time: str | None = None,
        client_email: str | None = None,
        notes: str | None = None,
    ) -> str:
        """Create a pending booking and return a payment link for the user to click.

        Use this when the client wants to book but should complete payment separately via a link.
        This creates a PENDING booking that the user can complete by clicking the payment link.
        """
        async with session_factory() as db:
            # 1. Resolve client
            client: User | None = None
            if client_email:
                res = await db.execute(
                    select(User).where(User.email == client_email.strip().lower()).limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                # Default to demo client or first active client
                res = await db.execute(
                    select(User)
                    .where(User.email == "client@example.com", User.role == UserRole.CLIENT)
                    .limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                res = await db.execute(select(User).where(User.role == UserRole.CLIENT).limit(1))
                client = res.scalar_one_or_none()

            if client is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Please log in first before booking an appointment.",
                    }
                )

            # 2. Resolve service
            parsed_uuid: UUID | None = None
            try:
                parsed_uuid = UUID(service_query.strip())
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
            else:
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

            if service is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Could not find an active service matching '{service_query}'.",
                    }
                )

            starts_at = _parse_starts_at(preferred_time)

            # 3. Create booking (PENDING status)
            try:
                booking = await booking_service.create_booking(
                    db,
                    client_id=client.id,
                    org_id=service.organization_id,
                    service_ids=[service.id],
                    starts_at=starts_at,
                    stylist_id=None,
                    customer_notes=notes or "Booked via SalonDesk AI Voice Assistant",
                )
                await db.commit()
            except Exception as exc:
                logger.warning("Failed to create booking: %s", exc)
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Could not book the appointment: {exc}",
                    }
                )

            # 4. Generate payment link
            org = await db.get(Organization, service.organization_id)
            org_name = org.name if org else "Salon"
            formatted_time = starts_at.strftime("%A, %b %d at %I:%M %p")

            # Payment link points to the booking checkout page
            payment_link = f"/client/book/{service.id}?slot={starts_at.isoformat()}"

            # Notify callback with payment link
            payload = {
                "type": "payment_link",
                "booking_id": str(booking.id),
                "service_id": str(service.id),
                "service_name": service.name,
                "organization_name": org_name,
                "organization_id": str(service.organization_id),
                "starts_at": starts_at.isoformat(),
                "formatted_time": formatted_time,
                "total_price": str(booking.total_price),
                "payment_link": payment_link,
            }

            if on_payment_link:
                try:
                    res = on_payment_link(payload)
                    if inspect.isawaitable(res):
                        await res
                except Exception as exc:
                    logger.warning("on_payment_link callback failed: %s", exc)

            return json.dumps(
                {
                    "status": "pending_payment",
                    "booking_id": str(booking.id),
                    "service_id": str(service.id),
                    "service_name": service.name,
                    "organization_name": org_name,
                    "organization_id": str(service.organization_id),
                    "starts_at": starts_at.isoformat(),
                    "formatted_time": formatted_time,
                    "total_price": str(booking.total_price),
                    "payment_link": payment_link,
                    "message": (
                        f"I've created your appointment for {service.name} at {org_name} on {formatted_time}. "
                        f"The total is ${booking.total_price}. Please click the payment link to complete your booking with a $0 PayPal authorization hold."
                    ),
                }
            )

    @function_tool()
    async def confirm_existing_booking(
        booking_id: str | None = None,
        client_email: str | None = None,
    ) -> str:
        """Confirm an existing pending booking by signing consent and placing a $0 PayPal authorization hold."""
        async with session_factory() as db:
            parsed_id: UUID | None = None
            if booking_id:
                try:
                    parsed_id = UUID(booking_id.strip())
                except ValueError:
                    parsed_id = None

            stmt = select(Booking).where(Booking.status == BookingStatus.PENDING)
            if parsed_id:
                stmt = stmt.where(Booking.id == parsed_id)
            elif client_email:
                stmt = stmt.join(User, Booking.client_id == User.id).where(
                    User.email == client_email.strip().lower()
                )

            res = await db.execute(stmt.order_by(Booking.created_at.desc()).limit(1))
            booking = res.scalar_one_or_none()

            if booking is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "No pending booking was found to confirm.",
                    }
                )

            terms = (
                "I authorize a $0 PayPal authorization hold for this booking under the salon "
                "cancellation policy."
            )
            await payment_service.create_consent(
                db,
                booking=booking,
                client_id=booking.client_id,
                terms_version="v1",
                terms_text=terms,
                signed_payload=f"booking={booking.id};auto_confirmed=true",
            )
            hold, _approval = await payment_service.create_hold(
                db,
                booking=booking,
                idempotency_key=f"confirm-hold-{booking.id}",
                currency="USD",
            )
            await payment_service.complete_hold(
                db, hold=hold, paypal_order_token=hold.paypal_order_id
            )
            await db.commit()

            formatted_time = booking.starts_at.strftime("%A, %b %d at %I:%M %p")
            payload = {
                "type": "booking_confirmed",
                "booking_id": str(booking.id),
                "starts_at": booking.starts_at.isoformat(),
                "formatted_time": formatted_time,
                "total_price": str(booking.total_price),
                "status": "CONFIRMED",
            }
            if on_booking_success:
                try:
                    res = on_booking_success(payload)
                    if inspect.isawaitable(res):
                        await res
                except Exception:
                    pass

            return json.dumps(
                {
                    "status": "success",
                    "booking_id": str(booking.id),
                    "status_code": "CONFIRMED",
                    "message": f"Booking {booking.id} is now confirmed with an authorized $0 PayPal hold.",
                }
            )

    @function_tool()
    async def get_client_bookings(
        client_email: str | None = None,
    ) -> str:
        """Get the client's current and upcoming bookings with cancellation details.

        Use this when the client asks about their bookings, appointments, or reservations.
        """
        async with session_factory() as db:
            # Resolve client
            client: User | None = None
            if client_email:
                res = await db.execute(
                    select(User).where(User.email == client_email.strip().lower()).limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                # Default to demo client or first active client
                res = await db.execute(
                    select(User)
                    .where(User.email == "client@example.com", User.role == UserRole.CLIENT)
                    .limit(1)
                )
                client = res.scalar_one_or_none()

            if client is None:
                res = await db.execute(select(User).where(User.role == UserRole.CLIENT).limit(1))
                client = res.scalar_one_or_none()

            if client is None:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Please log in first to view your bookings.",
                    }
                )

            # Get bookings
            bookings_result = await db.execute(
                select(Booking)
                .where(Booking.client_id == client.id)
                .options(selectinload(Booking.organization))
                .order_by(Booking.starts_at.desc())
                .limit(10)
            )
            bookings = list(bookings_result.scalars().all())

            if not bookings:
                return json.dumps(
                    {
                        "status": "success",
                        "message": "You have no bookings at this time. Would you like to book an appointment?",
                        "bookings": [],
                    }
                )

            booking_data = []
            for b in bookings:
                org = b.organization
                svc_names = (
                    ", ".join(bs.service.name for bs in b.booking_services if bs.service)
                    or "Salon service"
                )
                deadline_str = (
                    b.free_cancel_deadline_at.strftime("%b %d at %I:%M %p")
                    if b.free_cancel_deadline_at
                    else "24h prior"
                )
                formatted_time = b.starts_at.strftime("%A, %b %d at %I:%M %p")

                booking_data.append(
                    {
                        "booking_id": str(b.id),
                        "service_names": svc_names,
                        "organization_name": org.name if org else "Salon",
                        "starts_at": b.starts_at.isoformat(),
                        "formatted_time": formatted_time,
                        "status": b.status.value,
                        "agreed_hold_amount": str(b.agreed_hold_amount),
                        "free_cancel_deadline": deadline_str,
                        "late_cancel_fee": str(b.agreed_late_cancel_fee),
                        "can_cancel": b.status.value in ("CONFIRMED", "PENDING", "REAUTHORIZED"),
                    }
                )

            return json.dumps(
                {
                    "status": "success",
                    "message": f"Found {len(bookings)} booking(s).",
                    "bookings": booking_data,
                }
            )

    @function_tool()
    async def cancel_booking(
        booking_id: str,
        client_email: str | None = None,
    ) -> str:
        """Cancel a booking and explain what the client gains or loses.

        Use this when the client wants to cancel an appointment. This will explain
        the cancellation policy impact (free cancel vs late cancel fee).
        """
        async with session_factory() as db:
            # Parse booking ID
            parsed_id: UUID | None = None
            try:
                parsed_id = UUID(booking_id.strip())
            except ValueError:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Invalid booking ID format.",
                    }
                )

            # Get booking
            stmt = (
                select(Booking)
                .options(selectinload(Booking.organization))
                .where(Booking.id == parsed_id)
            )
            res = await db.execute(stmt)
            booking = res.scalar_one_or_none()

            if not booking:
                return json.dumps(
                    {
                        "status": "error",
                        "message": "Booking not found.",
                    }
                )

            # Check if cancelable
            if booking.status.value not in ("CONFIRMED", "PENDING", "REAUTHORIZED"):
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"This booking cannot be cancelled. Current status: {booking.status.value}",
                    }
                )

            # Check free cancel window
            now = datetime.now(UTC)
            is_free_cancel = (
                booking.free_cancel_deadline_at and now < booking.free_cancel_deadline_at
            )

            formatted_time = booking.starts_at.strftime("%A, %b %d at %I:%M %p")
            deadline_str = (
                booking.free_cancel_deadline_at.strftime("%b %d at %I:%M %p")
                if booking.free_cancel_deadline_at
                else "24h prior"
            )

            if is_free_cancel:
                # Free cancel - void the hold
                try:
                    await booking_service.cancel_booking(db, booking.id, reason="Client request")
                    await db.commit()

                    return json.dumps(
                        {
                            "status": "success",
                            "message": (
                                f"Booking cancelled successfully. Since you cancelled before the deadline ({deadline_str}), "
                                f"100% of your ${booking.agreed_hold_amount} hold will be voided and released ($0 charged). "
                                f"You gain: Full refund of your hold. You lose: The appointment time at {formatted_time}."
                            ),
                            "booking_id": str(booking.id),
                            "refund_amount": str(booking.agreed_hold_amount),
                            "cancellation_type": "free",
                        }
                    )
                except Exception as exc:
                    logger.warning("Failed to cancel booking: %s", exc)
                    return json.dumps(
                        {
                            "status": "error",
                            "message": f"Could not cancel booking: {exc}",
                        }
                    )
            else:
                # Late cancel - will incur fee
                return json.dumps(
                    {
                        "status": "warning",
                        "message": (
                            f"Cancellation deadline has passed (was {deadline_str}). "
                            f"If you cancel now, the salon may capture the late cancellation fee of ${booking.agreed_late_cancel_fee}. "
                            f"You gain: Cancel the appointment. You lose: ${booking.agreed_late_cancel_fee} late fee. "
                            f"Would you like to proceed with cancellation?"
                        ),
                        "booking_id": str(booking.id),
                        "late_fee": str(booking.agreed_late_cancel_fee),
                        "cancellation_type": "late",
                    }
                )

    @function_tool()
    async def get_organization_details(
        org_query: str,
    ) -> str:
        """Get detailed information about an organization/salon.

        Use this when the client asks for details about a specific salon.
        """
        async with session_factory() as db:
            parsed_uuid: UUID | None = None
            try:
                parsed_uuid = UUID(org_query.strip())
            except (ValueError, AttributeError):
                parsed_uuid = None

            query_clean = (org_query or "").strip()
            stmt = select(Organization).where(Organization.status == OrganizationStatus.APPROVED)

            if parsed_uuid:
                stmt = stmt.where(Organization.id == parsed_uuid)
            else:
                stmt = stmt.where(Organization.name.ilike(f"%{query_clean}%"))

            res = await db.execute(stmt.limit(1))
            org = res.scalar_one_or_none()

            if not org:
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Could not find an organization matching '{org_query}'.",
                    }
                )

            # Get services for this org
            svc_res = await db.execute(
                select(Service)
                .where(
                    Service.organization_id == org.id,
                    Service.status == ServiceStatus.ACTIVE,
                )
                .limit(5)
            )
            services = list(svc_res.scalars().all())

            return json.dumps(
                {
                    "status": "success",
                    "organization": {
                        "id": str(org.id),
                        "name": org.name,
                        "description": org.description,
                        "status": org.status.value,
                    },
                    "services": [
                        {
                            "id": str(s.id),
                            "name": s.name,
                            "base_price": str(s.base_price),
                            "duration_minutes": s.duration_minutes,
                        }
                        for s in services
                    ],
                }
            )

    @function_tool()
    async def get_service_details(
        service_query: str,
    ) -> str:
        """Get detailed information about a service.

        Use this when the client asks for details about a specific service.
        """
        async with session_factory() as db:
            parsed_uuid: UUID | None = None
            try:
                parsed_uuid = UUID(service_query.strip())
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
            else:
                stmt = stmt.where(Service.name.ilike(f"%{query_clean}%"))

            res = await db.execute(stmt.limit(1))
            service = res.scalar_one_or_none()

            if not service:
                return json.dumps(
                    {
                        "status": "error",
                        "message": f"Could not find a service matching '{service_query}'.",
                    }
                )

            org = service.organization
            return json.dumps(
                {
                    "status": "success",
                    "service": {
                        "id": str(service.id),
                        "name": service.name,
                        "description": service.description,
                        "base_price": str(service.base_price),
                        "duration_minutes": service.duration_minutes,
                        "category_name": service.category.name if service.category else None,
                    },
                    "organization": {
                        "id": str(org.id) if org else None,
                        "name": org.name if org else None,
                    },
                }
            )

    return [
        book_and_confirm_appointment,
        create_pending_booking_with_payment_link,
        confirm_existing_booking,
        get_client_bookings,
        cancel_booking,
        get_organization_details,
        get_service_details,
    ]
