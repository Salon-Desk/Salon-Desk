import base64
import json

from app.core.config import Settings
from app.services.livekit_tokens import build_room_name, create_participant_token


def _settings(**kwargs: object) -> Settings:
    return Settings(_env_file=None, **kwargs)  # type: ignore[call-arg]


def _jwt_payload(token: str) -> dict:
    payload = token.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(payload))


def test_build_room_name():
    name = build_room_name(language="en")
    assert name.startswith("salondesk-agent-en-")


def test_create_participant_token_mints_jwt():
    settings = _settings(
        livekit_url="wss://example.livekit.cloud",
        livekit_api_key="testkey",
        livekit_api_secret="testsecret" * 4,
        livekit_agent_name="salondesk-voice",
    )
    creds = create_participant_token(language="en", settings=settings)
    assert creds.server_url == settings.livekit_url
    assert creds.token
    assert "salondesk-agent-en-" in creds.room_name
    payload = _jwt_payload(creds.token)
    agents = payload["roomConfig"]["agents"]
    assert agents[0]["agentName"] == "salondesk-voice"


def test_empty_livekit_agent_name_defaults_for_dispatch(monkeypatch):
    monkeypatch.setenv("LIVEKIT_AGENT_NAME", "")
    settings = _settings(
        livekit_url="wss://example.livekit.cloud",
        livekit_api_key="testkey",
        livekit_api_secret="testsecret" * 4,
        livekit_agent_name="",
    )
    assert settings.livekit_agent_name == "salondesk-voice"
    creds = create_participant_token(language="en", settings=settings)
    payload = _jwt_payload(creds.token)
    assert payload["roomConfig"]["agents"][0]["agentName"] == "salondesk-voice"
