"""Location tracking and context building for voice agent."""

import json
import logging
from typing import Any

from sqlalchemy import select

from app.ai.rag_service import haversine_km
from app.models.enums import OrganizationStatus
from app.models.organization import Organization, OrgSettings

logger = logging.getLogger(__name__)


class LocationTracker:
    """Track user location from various sources."""

    def __init__(self):
        self.lat: float | None = None
        self.lng: float | None = None

    def update_from_metadata(self, metadata: Any) -> bool:
        """Update location from metadata. Returns True if updated."""
        lat, lng = parse_coordinates(metadata)
        if lat is not None and lng is not None:
            self.lat = lat
            self.lng = lng
            logger.info("Voice job user location updated: lat=%s lng=%s", lat, lng)
            return True
        return False

    def get(self) -> tuple[float | None, float | None]:
        """Get current location."""
        return self.lat, self.lng


def parse_coordinates(raw: Any) -> tuple[float | None, float | None]:
    """Parse coordinates from various input formats."""
    if not raw:
        return None, None

    data = decode_json_safely(raw)
    if not isinstance(data, dict):
        return None, None

    lat, lng = extract_lat_lng_from_dict(data)
    if lat is not None and lng is not None:
        return lat, lng

    # Check nested client_metadata
    client_meta = data.get("client_metadata")
    if client_meta:
        return parse_coordinates(client_meta)

    return None, None


def decode_json_safely(raw: Any) -> Any:
    """Safely decode JSON from bytes or string."""
    if isinstance(raw, (bytes, bytearray)):
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return None
    elif isinstance(raw, str):
        try:
            return json.loads(raw)
        except Exception:
            return None
    return raw


def extract_lat_lng_from_dict(data: dict) -> tuple[float | None, float | None]:
    """Extract lat/lng from dictionary with various key names."""
    lat = data.get("lat") or data.get("latitude")
    lng = data.get("lng") or data.get("longitude")

    if lat is not None and lng is not None:
        try:
            return float(lat), float(lng)
        except (ValueError, TypeError):
            pass

    return None, None


def is_location_query(text: str) -> bool:
    """Check if text is asking about location."""
    from .constants import _LOCATION_QUERY_KEYWORDS

    return any(h in text.lower() for h in _LOCATION_QUERY_KEYWORDS)


async def build_location_context(
    session_factory: Any,
    lat: float | None,
    lng: float | None,
) -> str:
    """Build location context string for LLM."""
    if lat is None or lng is None:
        return build_no_location_context()

    return await build_location_with_coordinates(session_factory, lat, lng)


def build_no_location_context() -> str:
    """Build context when no location is available."""
    return (
        "User Location Context:\n"
        "- Client has not shared browser GPS coordinates.\n"
        "- If the user asks for salons near them or where they are, "
        "ask what neighborhood in Addis Ababa they prefer "
        "(e.g. Bole, Kazanchis, Old Airport, Sarbet, CMC, Piassa)."
    )


async def build_location_with_coordinates(
    session_factory: Any,
    lat: float,
    lng: float,
) -> str:
    """Build context with actual coordinates and nearby salons."""
    nearest = await fetch_nearest_organizations(session_factory, lat, lng)

    lines = [
        "User Location Context:",
        "- The user has location sharing ENABLED in their browser/app.",
        f"- Current Coordinates: latitude {lat:.5f}, longitude {lng:.5f}",
        "- Nearest salons to user on the platform:",
    ]

    for dist, name, addr in nearest[:3]:
        lines.append(f"  * {name} ({dist:.1f} km away, at {addr})")

    lines.append(
        "- CRITICAL INSTRUCTION: You DO have direct access to the user's location. "
        "When the user asks 'where am I?', 'what salons are near me?', "
        "'closest salon', or asks for nearby recommendations, "
        "explicitly recommend these nearest salons by name, distance, and address. "
        "NEVER say you cannot access their location."
    )

    return "\n".join(lines)


async def fetch_nearest_organizations(
    session_factory: Any,
    lat: float,
    lng: float,
) -> list[tuple[float, str, str]]:
    """Fetch nearest organizations to given coordinates."""
    nearest: list[tuple[float, str, str]] = []

    try:
        async with session_factory() as session:
            result = await session.execute(
                select(Organization, OrgSettings)
                .join(OrgSettings, Organization.id == OrgSettings.org_id)
                .where(Organization.status == OrganizationStatus.APPROVED)
            )
            for org, s_row in result.all():
                if s_row.lat is not None and s_row.lng is not None:
                    dist = haversine_km(lat, lng, float(s_row.lat), float(s_row.lng))
                    nearest.append((dist, org.name, s_row.physical_address))
    except Exception as exc:
        logger.warning("Failed to query nearby salons: %s", exc)

    nearest.sort(key=lambda x: x[0])
    return nearest
