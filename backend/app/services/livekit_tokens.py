"""Mint LiveKit participant JWTs with agent dispatch (never expose API secret)."""

from __future__ import annotations

import json
import logging
import secrets
from dataclasses import dataclass
from datetime import timedelta

from app.core.config import Settings, get_settings
from app.core.exceptions import SalonDeskError

logger = logging.getLogger("salondesk.voice")


class LiveKitConfigError(SalonDeskError):
    pass


@dataclass
class LiveKitCredentials:
    token: str
    server_url: str
    room_name: str


def build_room_name(
    *,
    language: str,
    portal: str = "client",
    prefix: str = "salondesk",
) -> str:
    # Encode language + portal so they survive even if metadata is dropped.
    suffix = secrets.token_hex(3)
    lang = language if language in {"en", "am"} else "en"
    mode = portal if portal in {"client", "merchant", "admin"} else "client"
    return f"{prefix}-{mode}-agent-{lang}-{suffix}"


def create_participant_token(
    *,
    language: str = "en",
    participant_name: str | None = None,
    metadata: str | None = None,
    room_name: str | None = None,
    portal: str = "client",
    settings: Settings | None = None,
) -> LiveKitCredentials:
    cfg = settings or get_settings()
    if not cfg.livekit_url or not cfg.livekit_api_key or not cfg.livekit_api_secret:
        raise LiveKitConfigError(
            "LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET."
        )

    try:
        from livekit.api import AccessToken, VideoGrants
    except ImportError as exc:
        raise LiveKitConfigError(
            "livekit package is required. From backend/: uv sync --group dev"
        ) from exc

    mode = portal if portal in {"client", "merchant", "admin"} else "client"
    resolved_room_name = (room_name or "").strip() or build_room_name(
        language=language, portal=mode
    )
    identity = participant_name or f"{mode}-{secrets.token_hex(4)}"
    room_meta = {
        "app": "salondesk",
        "language": language,
        "mode": "voice",
        "portal": mode,
    }
    if metadata:
        room_meta["client_metadata"] = metadata
        try:
            parsed = json.loads(metadata) if isinstance(metadata, str) else metadata
            if isinstance(parsed, dict):
                for k in ("lat", "lng", "latitude", "longitude", "city", "address"):
                    if k in parsed and parsed[k] is not None:
                        room_meta[k] = parsed[k]
        except Exception:
            pass

    grants = VideoGrants(
        room_join=True,
        room=resolved_room_name,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True,
    )

    token_builder = (
        AccessToken(cfg.livekit_api_key, cfg.livekit_api_secret)
        .with_identity(identity)
        .with_name(identity)
        .with_grants(grants)
        .with_metadata(json.dumps(room_meta))
        .with_ttl(timedelta(hours=1))
    )

    # Auto-dispatch registered worker into the room (protobuf shape varies by SDK version).
    try:
        from google.protobuf.json_format import ParseDict
        from livekit.protocol.room import RoomConfiguration

        agent_name = cfg.livekit_agent_name or "salondesk-voice"
        room_config = ParseDict(
            {
                "agents": [
                    {
                        "agentName": agent_name,
                        "metadata": json.dumps(room_meta),
                    }
                ]
            },
            RoomConfiguration(),
        )
        token_builder = token_builder.with_room_config(room_config)
    except Exception:
        logger.exception(
            "Failed to attach LiveKit agent dispatch to token; worker will not auto-join"
        )

    jwt = token_builder.to_jwt()
    return LiveKitCredentials(
        token=jwt,
        server_url=cfg.livekit_url,
        room_name=resolved_room_name,
    )


def parse_language_from_room_name(room_name: str) -> str:
    # Expected: {prefix}-{portal}-agent-{en|am}-{suffix} or legacy {prefix}-agent-{en|am}-{suffix}
    parts = (room_name or "").split("-")
    for i, part in enumerate(parts):
        if part == "agent" and i + 1 < len(parts):
            lang = parts[i + 1]
            if lang in {"en", "am"}:
                return lang
    return "en"


def parse_portal_from_room_name(room_name: str) -> str:
    # Expected: {prefix}-{portal}-agent-{lang}-{suffix}
    parts = (room_name or "").split("-")
    for i, part in enumerate(parts):
        if part == "agent" and i >= 1:
            candidate = parts[i - 1]
            if candidate in {"client", "merchant", "admin"}:
                return candidate
    return "client"
