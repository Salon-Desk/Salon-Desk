"""JSON response builders for booking tools."""

from __future__ import annotations

import json
from typing import Any


def error_response(message: str) -> str:
    """Build a standardized error response."""
    return json.dumps({"status": "error", "message": message})


def success_response(
    booking_id: str,
    service_name: str,
    org_name: str,
    formatted_time: str,
    total_price: str,
    message: str,
) -> str:
    """Build a success response for booking confirmation."""
    return json.dumps(
        {
            "status": "success",
            "booking_id": booking_id,
            "status_code": "CONFIRMED",
            "service_name": service_name,
            "organization_name": org_name,
            "time": formatted_time,
            "total_price": total_price,
            "message": message,
        }
    )


def partial_success_response(booking_id: str, message: str) -> str:
    """Build a partial success response (booking created but hold failed)."""
    return json.dumps(
        {
            "status": "partial",
            "booking_id": booking_id,
            "message": message,
        }
    )


def pending_payment_response(
    booking_id: str,
    service_id: str,
    service_name: str,
    org_name: str,
    org_id: str,
    starts_at: str,
    formatted_time: str,
    total_price: str,
    payment_link: str,
    message: str,
) -> str:
    """Build a response for pending booking with payment link."""
    return json.dumps(
        {
            "status": "pending_payment",
            "booking_id": booking_id,
            "service_id": service_id,
            "service_name": service_name,
            "organization_name": org_name,
            "organization_id": org_id,
            "starts_at": starts_at,
            "formatted_time": formatted_time,
            "total_price": total_price,
            "payment_link": payment_link,
            "message": message,
        }
    )


def bookings_list_response(bookings: list[dict[str, Any]], count: int) -> str:
    """Build a response for client bookings list."""
    return json.dumps(
        {
            "status": "success",
            "message": f"Found {count} booking(s).",
            "bookings": bookings,
        }
    )


def no_bookings_response() -> str:
    """Build a response when client has no bookings."""
    return json.dumps(
        {
            "status": "success",
            "message": "You have no bookings at this time. Would you like to book an appointment?",
            "bookings": [],
        }
    )


def cancel_free_response(
    booking_id: str,
    refund_amount: str,
    deadline: str,
    formatted_time: str,
) -> str:
    """Build a response for free cancellation."""
    return json.dumps(
        {
            "status": "success",
            "message": (
                f"Booking cancelled successfully. Since you cancelled before the deadline ({deadline}), "
                f"100% of your ${refund_amount} hold will be voided and released ($0 charged). "
                f"You gain: Full refund of your hold. You lose: The appointment time at {formatted_time}."
            ),
            "booking_id": booking_id,
            "refund_amount": refund_amount,
            "cancellation_type": "free",
        }
    )


def cancel_late_response(booking_id: str, late_fee: str, deadline: str) -> str:
    """Build a response for late cancellation warning."""
    return json.dumps(
        {
            "status": "warning",
            "message": (
                f"Cancellation deadline has passed (was {deadline}). "
                f"If you cancel now, the salon may capture the late cancellation fee of ${late_fee}. "
                f"You gain: Cancel the appointment. You lose: ${late_fee} late fee. "
                f"Would you like to proceed with cancellation?"
            ),
            "booking_id": booking_id,
            "late_fee": late_fee,
            "cancellation_type": "late",
        }
    )


def service_details_response(service: dict[str, Any], org: dict[str, Any]) -> str:
    """Build a response for service details."""
    return json.dumps(
        {
            "status": "success",
            "service": service,
            "organization": org,
        }
    )


def organization_details_response(org: dict[str, Any], services: list[dict[str, Any]]) -> str:
    """Build a response for organization details."""
    return json.dumps(
        {
            "status": "success",
            "organization": org,
            "services": services,
        }
    )
