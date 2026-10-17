"""LiveKit worker: STT → semantic RAG / booking intent → LLM (+ tools) → TTS.

Separate process from uvicorn (PRD text + voice AI assistant).
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.ai.agent.prompts import (
    build_voice_instructions,
    greeting_for,
    is_farewell,
)
from app.ai.rag_service import (
    build_voice_rag_instruction,
    detect_intent,
    haversine_km,
    retrieve_context,
)
from app.ai.tools import build_voice_tools
from app.core.config import get_settings
from app.models.enums import OrganizationStatus
from app.models.organization import Organization, OrgSettings
from app.services.livekit_tokens import parse_language_from_room_name

logger = logging.getLogger("salondesk.voice")

_NOISE_RE = re.compile(r"^(.)\1{6,}$")


def _is_garbage_transcript(text: str) -> bool:
    cleaned = (text or "").strip()
    if len(cleaned) < 2:
        return True
    return bool(_NOISE_RE.match(cleaned.replace(" ", "")))


def _resolve_language(room_name: str, metadata: str | None) -> str:
    if metadata:
        try:
            data = json.loads(metadata)
            lang = data.get("language")
            if lang in {"en", "am"}:
                return lang
        except json.JSONDecodeError:
            pass
    return parse_language_from_room_name(room_name)


def _parse_coordinates(raw: Any) -> tuple[float | None, float | None]:
    if not raw:
        return None, None
    data = raw
    if isinstance(raw, (bytes, bytearray)):
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            return None, None
    elif isinstance(raw, str):
        try:
            data = json.loads(raw)
        except Exception:
            return None, None
    if not isinstance(data, dict):
        return None, None

    lat = data.get("lat") or data.get("latitude")
    lng = data.get("lng") or data.get("longitude")
    if lat is not None and lng is not None:
        try:
            return float(lat), float(lng)
        except (ValueError, TypeError):
            pass

    client_meta = data.get("client_metadata")
    if client_meta:
        return _parse_coordinates(client_meta)

    return None, None


async def _build_location_context(
    session_factory: Any,
    lat: float | None,
    lng: float | None,
) -> str:
    if lat is None or lng is None:
        return (
            "User Location Context:\n"
            "- Client has not shared browser GPS coordinates.\n"
            "- If the user asks for salons near them or where they are, ask what neighborhood in Addis Ababa they prefer (e.g. Bole, Kazanchis, Old Airport, Sarbet, CMC, Piassa)."
        )

    nearest: list[tuple[float, str, str]] = []
    try:
        from sqlalchemy import select

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
    lines = [
        "User Location Context:",
        "- The user has location sharing ENABLED in their browser/app.",
        f"- Current Coordinates: latitude {lat:.5f}, longitude {lng:.5f}",
        "- Nearest salons to user on the platform:",
    ]
    for dist, name, addr in nearest[:3]:
        lines.append(f"  * {name} ({dist:.1f} km away, at {addr})")
    lines.append(
        "- CRITICAL INSTRUCTION: You DO have direct access to the user's location. When the user asks 'where am I?', 'what salons are near me?', 'closest salon', or asks for nearby recommendations, explicitly recommend these nearest salons by name, distance, and address. NEVER say you cannot access their location."
    )
    return "\n".join(lines)


def _openai_compatible_llm():
    from livekit.plugins import openai as lk_openai

    settings = get_settings()
    provider = settings.active_voice_llm_provider
    if provider == "openai":
        return lk_openai.LLM(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )
    if provider == "ollama":
        return lk_openai.LLM(
            model=settings.ollama_model,
            api_key=settings.ollama_api_key or "ollama",
            base_url=settings.ollama_base_url,
        )
    return lk_openai.LLM(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        base_url=settings.groq_base_url,
    )


def _build_session_factory():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)


def prewarm(proc: Any) -> None:
    try:
        from livekit.plugins import silero

        proc.userdata["vad"] = silero.VAD.load()
        logger.info("Silero VAD prewarmed")
    except Exception as exc:  # pragma: no cover
        logger.warning("VAD prewarm skipped: %s", exc)


async def entrypoint(ctx: Any) -> None:
    from livekit.agents import (
        Agent,
        AgentSession,
        AutoSubscribe,
        RoomInputOptions,
        llm,
    )
    from livekit.plugins import deepgram, silero

    settings = get_settings()
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    room = ctx.room
    room_name = room.name or ""
    language = _resolve_language(room_name, getattr(room, "metadata", None))
    logger.info("Voice job room=%s language=%s", room_name, language)

    user_location: dict[str, float | None] = {"lat": None, "lng": None}

    # Extract location from job or room metadata
    job_meta = getattr(ctx.job, "metadata", None) if hasattr(ctx, "job") else None
    init_lat, init_lng = _parse_coordinates(job_meta)
    if init_lat is None:
        init_lat, init_lng = _parse_coordinates(getattr(room, "metadata", None))
    if init_lat is not None and init_lng is not None:
        user_location["lat"] = init_lat
        user_location["lng"] = init_lng
        logger.info(
            "Voice job user location resolved from metadata: lat=%s lng=%s", init_lat, init_lng
        )

    def _inspect_participant(participant: Any) -> None:
        p_lat, p_lng = _parse_coordinates(getattr(participant, "metadata", None))
        if p_lat is None and hasattr(participant, "attributes"):
            attrs = getattr(participant, "attributes", {}) or {}
            p_lat, p_lng = _parse_coordinates(attrs)
        if p_lat is not None and p_lng is not None:
            user_location["lat"] = p_lat
            user_location["lng"] = p_lng
            logger.info(
                "Voice job user location updated from participant: lat=%s lng=%s", p_lat, p_lng
            )

    for p in room.remote_participants.values():
        _inspect_participant(p)

    @room.on("participant_connected")
    def on_participant_connected(participant: Any) -> None:
        _inspect_participant(participant)

    @room.on("participant_attributes_changed")
    def on_participant_attributes_changed(changed_attributes: Any, participant: Any) -> None:
        _inspect_participant(participant)

    @room.on("data_received")
    def on_data_received(data_packet: Any) -> None:
        try:
            raw_bytes = getattr(data_packet, "data", None)
            if raw_bytes is None and isinstance(data_packet, (bytes, bytearray)):
                raw_bytes = data_packet
            if raw_bytes:
                text_data = (
                    raw_bytes.decode("utf-8")
                    if isinstance(raw_bytes, (bytes, bytearray))
                    else str(raw_bytes)
                )
                parsed = json.loads(text_data)
                if isinstance(parsed, dict) and parsed.get("type") in ("user_location", "location"):
                    p_lat, p_lng = _parse_coordinates(parsed)
                    if p_lat is not None and p_lng is not None:
                        user_location["lat"] = p_lat
                        user_location["lng"] = p_lng
                        logger.info(
                            "Voice job user location updated via data message: lat=%s lng=%s",
                            p_lat,
                            p_lng,
                        )
                        asyncio.create_task(_publish_nearby_orgs(p_lat, p_lng))
        except Exception:
            pass

    async def _publish_auth_success(payload: dict[str, Any]) -> None:
        try:
            if room.local_participant:
                data = json.dumps(payload)
                await room.local_participant.publish_data(data, topic="lk.client.auth")
                logger.info("Published auth_success message to room participant")
        except Exception as exc:
            logger.warning("Failed to publish auth_success data: %s", exc)

    async def _publish_booking_success(payload: dict[str, Any]) -> None:
        try:
            if room.local_participant:
                data = json.dumps(payload)
                await room.local_participant.publish_data(data, topic="lk.client.booking")
                logger.info("Published booking_confirmed message to room participant")
        except Exception as exc:
            logger.warning("Failed to publish booking data: %s", exc)

    async def _publish_discovery_results(payload: dict[str, Any]) -> None:
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

    async def _publish_nearby_orgs(lat: float, lng: float) -> None:
        try:
            from sqlalchemy import select

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

    session_factory = _build_session_factory()
    tools = build_voice_tools(
        session_factory,
        user_location_getter=lambda: (user_location["lat"], user_location["lng"]),
        on_auth_success=_publish_auth_success,
        on_booking_success=_publish_booking_success,
        on_discovery_results=_publish_discovery_results,
    )

    location_ctx_text = await _build_location_context(
        session_factory, user_location["lat"], user_location["lng"]
    )
    initial_instructions = build_voice_instructions(
        language=language, location_summary=location_ctx_text
    )

    vad = ctx.proc.userdata.get("vad") or silero.VAD.load()
    if not settings.deepgram_api_key:
        raise RuntimeError("DEEPGRAM_API_KEY is required for the voice worker")

    stt = deepgram.STT(api_key=settings.deepgram_api_key)
    tts = deepgram.TTS(api_key=settings.deepgram_api_key)
    voice_llm = _openai_compatible_llm()

    class SalonVoiceAgent(Agent):
        def __init__(self) -> None:
            super().__init__(instructions=initial_instructions, tools=tools)

        async def on_enter(self) -> None:
            await self.session.say(greeting_for(language))

        async def on_user_turn_completed(
            self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage
        ) -> None:
            text = (new_message.text_content or "").strip()
            if _is_garbage_transcript(text):
                return

            if is_farewell(text):
                farewell_text = (
                    "Goodbye! Thank you for choosing SalonDesk. Have a wonderful day!"
                    if language != "am"
                    else "ደህና ሁኑ! SalonDesk ስለተጠቀሙ እናመሰግናለን። መልካም ቀን ይሁንልዎ!"
                )
                logger.info("Farewell detected (%r). Speaking goodbye and closing room.", text)

                async def _say_farewell_and_close() -> None:
                    try:
                        speech = await self.session.say(farewell_text, allow_interruptions=False)
                        await speech.wait_for_playout()
                    except Exception as exc:
                        logger.warning("Farewell playout error: %s", exc)

                    # Signal frontend voice-agent-view that the call has concluded
                    try:
                        data = json.dumps({"type": "call_ended"})
                        if room.local_participant:
                            await room.local_participant.publish_data(
                                data, topic="lk.agent.control"
                            )

                    except Exception as exc:
                        logger.warning("Failed to publish call_ended data: %s", exc)

                    await asyncio.sleep(0.5)
                    try:
                        await room.disconnect()
                    except Exception as exc:
                        logger.warning("Failed to disconnect room: %s", exc)

                asyncio.create_task(_say_farewell_and_close())
                from livekit.agents.llm import StopResponse

                raise StopResponse()

            intent = detect_intent(text)
            curr_lat = user_location["lat"]
            curr_lng = user_location["lng"]
            is_loc_query = any(
                h in text.lower()
                for h in (
                    "near me",
                    "nearby",
                    "closest",
                    "where am i",
                    "my location",
                    "nearest",
                    "around me",
                    "close by",
                )
            )

            # Always ground with semantic search; booking intent changes instruction tone.
            try:
                async with session_factory() as session:
                    retrieved = await asyncio.wait_for(
                        retrieve_context(
                            session,
                            text,
                            room_language=language,
                            chunk_limit=settings.voice_rag_chunk_limit,
                            settings=settings,
                            user_lat=curr_lat,
                            user_lng=curr_lng,
                        ),
                        timeout=settings.voice_rag_timeout_s,
                    )
                # Force booking intent if classifier says so (even if RAG guessed discover)
                if intent == "booking":
                    retrieved.intent = "booking"

                instruction = build_voice_rag_instruction(retrieved)
                if is_loc_query and curr_lat is not None and curr_lng is not None:
                    loc_summary = await _build_location_context(session_factory, curr_lat, curr_lng)
                    instruction = f"{instruction}\n\n{loc_summary}"

                turn_ctx.add_message(
                    role="system",
                    content=instruction,
                )
            except TimeoutError:
                logger.warning("Voice RAG timed out after %ss", settings.voice_rag_timeout_s)
                turn_ctx.add_message(
                    role="system",
                    content=(
                        "Knowledge lookup timed out. Ask a clarifying question; "
                        "do not invent salon facts."
                    ),
                )
            except Exception as exc:
                logger.exception("Voice RAG failed: %s", exc)
                turn_ctx.add_message(
                    role="system",
                    content="Knowledge lookup failed. Keep the reply short and honest.",
                )

    session = AgentSession(
        vad=vad,
        stt=stt,
        llm=voice_llm,
        tts=tts,
        preemptive_generation=False,
    )
    await session.start(
        agent=SalonVoiceAgent(),
        room=room,
        room_input_options=RoomInputOptions(),
    )
