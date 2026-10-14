"""Mint LiveKit participant JWTs with agent dispatch (never expose API secret)."""

from __future__ import annotations

import json
import secrets
from dataclasses import dataclass

from app.core.config import Settings, get_settings
from app.core.exceptions import SalonDeskError


class LiveKitConfigError(SalonDeskError):
    pass


@dataclass
class LiveKitCredentials:
    token: str
    server_url: str
    room_name: str


def build_room_name(*, language: str, prefix: str = "salondesk") -> str:
    # Encode language in room name so it survives even if metadata is dropped.
    suffix = secrets.token_hex(3)
    lang = language if language in {"en", "am"} else "en"
    return f"{prefix}-agent-{lang}-{suffix}"


def create_participant_token(
    *,
    language: str = "en",
    participant_name: str | None = None,
    metadata: str | None = None,
    settings: Settings | None = None,
) -> LiveKitCredentials:
    cfg = settings or get_settings()
    if not cfg.livekit_url or not cfg.livekit_api_key or not cfg.livekit_api_secret:
        raise LiveKitConfigError(
            "LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET."
        )

    try:
        from livekit.api import AccessToken, VideoGrants
        from livekit.api.access_token import RoomAgentDispatch, RoomConfiguration
    except ImportError as exc:
        raise LiveKitConfigError(
            "livekit package is required. Install backend dependencies with uv sync."
        ) from exc

    room_name = build_room_name(language=language)
    identity = participant_name or f"client-{secrets.token_hex(4)}"
    room_meta = {
        "app": "salondesk",
        "language": language,
        "mode": "voice",
    }
    if metadata:
        room_meta["client_metadata"] = metadata

    grants = VideoGrants(
        room_join=True,
        room=room_name,
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
        .with_ttl(60 * 60)
    )

    # Auto-dispatch registered worker into the room.
    try:
        room_config = RoomConfiguration(
            agents=[
                RoomAgentDispatch(
                    agent_name=cfg.livekit_agent_name or "salondesk-voice",
                    metadata=json.dumps(room_meta),
                )
            ]
        )
        token_builder = token_builder.with_room_config(room_config)
    except Exception:
        # Older livekit SDK variants may lack RoomConfiguration; JWT still works.
        pass

    jwt = token_builder.to_jwt()
    return LiveKitCredentials(
        token=jwt,
        server_url=cfg.livekit_url,
        room_name=room_name,
    )


def parse_language_from_room_name(room_name: str) -> str:
    # Expected: {prefix}-agent-{en|am}-{suffix}
    parts = (room_name or "").split("-")
    for i, part in enumerate(parts):
        if part == "agent" and i + 1 < len(parts):
            lang = parts[i + 1]
            if lang in {"en", "am"}:
                return lang
    return "en"
