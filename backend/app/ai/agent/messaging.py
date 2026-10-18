"""Message publishing to LiveKit room."""

import json
import logging
from typing import Any

from sqlalchemy import select

from app.ai.rag_service import haversine_km
from app.models.enums import OrganizationStatus
from app.models.organization import Organization, OrgSettings

logger = logging.getLogger(__name__)


async def publish_auth_success(room: Any, payload: dict[str, Any]) -> None:
    """Publish auth success message to room."""
    try:
        if room.local_participant:
            data = json.dumps(payload)
            await room.local_participant.publish_data(data, topic="lk.client.auth")
            logger.info("Published auth_success message to room participant")
    except Exception as exc:
        logger.warning("Failed to publish auth_success data: %s", exc)


async def publish_booking_success(room: Any, payload: dict[str, Any]) -> None:
    """Publish booking success message to room."""
    try:
        if room.local_participant:
            data = json.dumps(payload)
            await room.local_participant.publish_data(data, topic="lk.client.booking")
            logger.info("Published booking_confirmed message to room participant")
    except Exception as exc:
        logger.warning("Failed to publish booking data: %s", exc)


async def publish_discovery_results(room: Any, payload: dict[str, Any]) -> None:
    """Publish catalog discovery results to room."""
    try:
        if room.local_participant:
            data = json.dumps(
                {
                    "type": "catalog_results",
                    "recommendations": payload.get("recommendations", []),
                    "organizations": payload.get("organizations", []),
                }
            )
            await room.local_participant.publish_data(data, topic="lk.client.catalog")
            logger.info("Published catalog_results message to room participant")
    except Exception as exc:
        logger.warning("Failed to publish catalog data: %s", exc)


async def publish_nearby_orgs(
    room: Any,
    session_factory: Any,
    lat: float,
    lng: float,
) -> None:
    """Publish nearby organizations to room."""
    try:
        async with session_factory() as session:
            result = await session.execute(
                select(Organization, OrgSettings)
                .join(OrgSettings, Organization.id == OrgSettings.org_id)
                .where(Organization.status == OrganizationStatus.APPROVED)
            )
            org_list = []
            for org, s_row in result.all():
                if s_row.lat is not None and s_row.lng is not None:
                    dist = haversine_km(lat, lng, float(s_row.lat), float(s_row.lng))
                    org_list.append(
                        {
                            "id": str(org.id),
                            "name": org.name,
                            "description": org.description,
                            "picture": org.picture,
                            "physical_address": s_row.physical_address,
                            "rating": 4.9,
                            "distance_km": round(dist, 1),
                        }
                    )
            org_list.sort(key=lambda x: x["distance_km"])

            if room.local_participant and org_list:
                data = json.dumps(
                    {
                        "type": "nearby_organizations",
                        "organizations": org_list[:6],
                    }
                )
                await room.local_participant.publish_data(data, topic="lk.client.organizations")
                logger.info("Published nearby_organizations to room")
    except Exception as exc:
        logger.warning("Failed to publish nearby orgs: %s", exc)


async def publish_call_ended(room: Any) -> None:
    """Publish call ended signal to room."""
    try:
        data = json.dumps({"type": "call_ended"})
        if room.local_participant:
            await room.local_participant.publish_data(data, topic="lk.agent.control")
    except Exception as exc:
        logger.warning("Failed to publish call_ended data: %s", exc)


async def publish_ui_action(room: Any, payload: dict[str, Any]) -> None:
    """Publish UI navigation or interactive action message to room."""
    try:
        if room.local_participant:
            data = json.dumps(payload)
            await room.local_participant.publish_data(data, topic="lk.agent.ui_action")
            logger.info(
                "Published ui_action message: type=%s action=%s target=%s",
                payload.get("type"),
                payload.get("action"),
                payload.get("target"),
            )
    except Exception as exc:
        logger.warning("Failed to publish ui_action data: %s", exc)
