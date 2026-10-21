"""Shared chat response assembly for the concierge route."""

from __future__ import annotations

from typing import Any

from app.ai.support_actions import AgentNavigation
from app.schemas.chat import ChatCitation, ChatResponse, OrganizationCardOut, ServiceCardOut

CLIENT_BOOKING_PHRASES = (
    "my booking",
    "my appointment",
    "my reservation",
    "cancel booking",
    "cancel appointment",
    "cancel my",
    "what did i book",
    "when is my",
    "cancellation status",
    "view booking",
    "show booking",
)
CLIENT_DETAIL_PHRASES = (
    "organization detail",
    "salon detail",
    "service detail",
    "about the salon",
    "about the service",
    "more about",
)


def chat_response(
    llm: Any,
    *,
    reply: str,
    detected_language: str,
    intent: str,
    **extra: Any,
) -> ChatResponse:
    """Fill provider and model from the LLM that produced the reply."""
    return ChatResponse(
        reply=reply,
        provider=llm.provider_name,
        model=llm.model,
        detected_language=detected_language,
        intent=intent,
        **extra,
    )


def retrieved_chat_response(
    llm: Any,
    *,
    reply: str,
    retrieved: Any,
    navigation: AgentNavigation | None,
    ui_action: Any,
) -> ChatResponse:
    """Map a retrieval result onto the public chat payload."""
    return chat_response(
        llm,
        reply=reply,
        detected_language=retrieved.detected_language,
        intent=retrieved.intent,
        citations=[
            ChatCitation(
                entity_type=chunk.entity_type,
                entity_id=chunk.entity_id,
                title=chunk.title,
                content=chunk.content,
            )
            for chunk in retrieved.chunks
        ],
        recommendations=[
            ServiceCardOut(
                service_id=card.service_id,
                organization_id=card.organization_id,
                name=card.name,
                organization_name=card.organization_name,
                organization_picture=card.organization_picture,
                image_url=card.image_url,
                base_price=card.base_price,
                duration_minutes=card.duration_minutes,
                category_name=card.category_name,
                description=card.description,
                physical_address=card.physical_address,
                distance_km=card.distance_km,
                score=card.score,
            )
            for card in retrieved.recommendations
        ],
        organizations=[
            OrganizationCardOut(
                id=org.id,
                name=org.name,
                description=org.description,
                picture=org.picture,
                physical_address=org.physical_address,
                rating=org.rating,
                service_count=org.service_count,
                distance_km=org.distance_km,
            )
            for org in retrieved.organizations
        ],
        navigation=navigation,
        ui_action=ui_action,
    )


def _asks(message: str, phrases: tuple[str, ...]) -> bool:
    lowered = message.lower()
    return any(phrase in lowered for phrase in phrases)


async def with_client_booking_context(
    db: Any,
    user: Any,
    message: str,
    system: str,
    navigation: AgentNavigation | None,
) -> tuple[str, AgentNavigation | None]:
    """Append the signed-in client's live bookings when they ask about them."""
    if not (_asks(message, CLIENT_BOOKING_PHRASES) or _asks(message, CLIENT_DETAIL_PHRASES)):
        return system, navigation

    if user:
        from app.services import booking_service

        user_bookings = await booking_service.list_client_bookings(db, user.id)
        active_bookings = [
            booking
            for booking in user_bookings
            if booking.status.value in ("CONFIRMED", "PENDING", "REAUTHORIZED")
        ]
        if active_bookings:
            booking_descriptions = []
            for booking in active_bookings[:3]:
                svc_names = (
                    ", ".join(
                        item.service.name for item in booking.booking_services if item.service
                    )
                    or "Salon service"
                )
                deadline_str = (
                    booking.free_cancel_deadline_at.strftime("%b %d at %I:%M %p")
                    if booking.free_cancel_deadline_at
                    else "24h prior"
                )
                org_name = booking.organization.name if booking.organization else "Salon"
                booking_descriptions.append(
                    f"- Booking #{str(booking.id)[:8]}: {svc_names} at {org_name} "
                    f"on {booking.starts_at.strftime('%A, %b %d at %I:%M %p')}. "
                    f"Agreed hold: ${booking.agreed_hold_amount}. "
                    f"Free cancel deadline: {deadline_str}. "
                    f"Late cancel penalty: ${booking.agreed_late_cancel_fee}. "
                    f"Status: {booking.status.value}."
                )
            bookings_text = "\n".join(booking_descriptions)
            note = (
                f"\n\n[Client's Live Bookings & Cancellation Information:\n{bookings_text}\n"
                f"Gain/Loss Advisory: If the client cancels before the free cancel deadline, "
                f"100% of the PayPal authorization hold is voided and released ($0 debited). "
                f"If the client cancels late after the deadline, the salon may capture the agreed late cancellation fee. "
                f"Direct them to open My Bookings to confirm or cancel their appointment.]"
            )
            navigation = AgentNavigation(
                target="/client/bookings",
                label="View My Bookings & Cancel",
                reason="Check booking details or manage cancellation",
            )
        else:
            note = (
                "\n\n[Client Account Information: The client has no active appointments at this time. "
                "Remind them they can browse services or book an appointment anytime.]"
            )
    else:
        note = (
            "\n\n[Client Account Note: The client is currently not signed in. "
            "Prompt them to sign in or use the Sign In modal so you can look up their active bookings and cancellation details.]"
        )
    return f"{system}{note}", navigation
