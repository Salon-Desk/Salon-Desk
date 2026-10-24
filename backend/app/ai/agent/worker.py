"""LiveKit worker: STT → semantic RAG / booking intent → LLM (+ tools) → TTS.

Separate process from uvicorn (PRD text + voice AI assistant).
"""

import asyncio
import json
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agent.prompts import build_voice_instructions, greeting_for, is_farewell
from app.ai.portal import is_support_portal, normalize_portal
from app.ai.rag_service import build_voice_rag_instruction, detect_intent, retrieve_context
from app.ai.tools import build_voice_tools
from app.core.config import get_settings

from .location import (
    LocationTracker,
    build_location_context,
    is_location_query,
)
from .messaging import (
    publish_auth_success,
    publish_booking_success,
    publish_call_ended,
    publish_discovery_results,
    publish_nearby_orgs,
    publish_payment_link,
    publish_ui_action,
)
from .session import (
    build_session_factory,
    is_garbage_transcript,
    openai_compatible_llm,
    resolve_language,
    resolve_portal,
)

logger = logging.getLogger("salondesk.voice")


def prewarm(proc: Any) -> None:
    """Pre-warm VAD model for faster startup."""
    try:
        from livekit.plugins import silero

        proc.userdata["vad"] = silero.VAD.load()
        logger.info("Silero VAD prewarmed")
    except Exception as exc:  # pragma: no cover
        logger.warning("VAD prewarm skipped: %s", exc)


class SalonVoiceAgent:
    """Main voice agent for SalonDesk."""

    def __init__(
        self,
        language: str,
        session_factory: Any,
        location_tracker: LocationTracker,
        settings: Any,
        tools: list,
        room: Any,
        portal: str = "client",
    ):
        self.language = language
        self.portal = normalize_portal(portal)
        self.session_factory = session_factory
        self.location_tracker = location_tracker
        self.settings = settings
        self.room = room
        self.initial_instructions = ""

    async def initialize(self) -> None:
        """Initialize agent with location context and instructions."""
        location_ctx = None
        if not is_support_portal(self.portal):
            lat, lng = self.location_tracker.get()
            location_ctx = await build_location_context(self.session_factory, lat, lng)
        self.initial_instructions = build_voice_instructions(
            language=self.language,
            location_summary=location_ctx,
            portal=self.portal,
        )

    async def handle_user_turn(
        self,
        turn_ctx: Any,
        new_message: Any,
    ) -> None:
        """Handle user turn in conversation."""
        text = (new_message.text_content or "").strip()

        if is_garbage_transcript(text):
            return

        if is_farewell(text):
            await self.handle_farewell()
            from livekit.agents.llm import StopResponse

            raise StopResponse()

        await self.handle_regular_turn(turn_ctx, text)

    async def handle_farewell(self) -> None:
        """Handle farewell - say goodbye and close room."""
        logger.info("Farewell detected. Speaking goodbye and closing room.")

        async def say_farewell_and_close() -> None:
            try:
                await asyncio.sleep(0.5)
            except Exception as exc:
                logger.warning("Farewell playout error: %s", exc)

            await publish_call_ended(self.room)
            await asyncio.sleep(0.5)

            try:
                await self.room.disconnect()
            except Exception as exc:
                logger.warning("Failed to disconnect room: %s", exc)

        asyncio.create_task(say_farewell_and_close())

    async def handle_regular_turn(self, turn_ctx: Any, text: str) -> None:
        """Handle regular user turn with RAG and intent detection."""
        intent = detect_intent(text)
        curr_lat, curr_lng = self.location_tracker.get()
        is_loc_query = is_location_query(text) and not is_support_portal(self.portal)

        try:
            async with self.session_factory() as session:
                retrieved = await asyncio.wait_for(
                    retrieve_context(
                        session,
                        text,
                        room_language=self.language,
                        chunk_limit=self.settings.voice_rag_chunk_limit,
                        settings=self.settings,
                        user_lat=curr_lat if not is_support_portal(self.portal) else None,
                        user_lng=curr_lng if not is_support_portal(self.portal) else None,
                        portal=self.portal,
                    ),
                    timeout=self.settings.voice_rag_timeout_s,
                )

            if intent == "booking" and not is_support_portal(self.portal):
                retrieved.intent = "booking"

            instruction = build_voice_rag_instruction(retrieved, portal=self.portal)

            if is_loc_query and curr_lat is not None and curr_lng is not None:
                loc_summary = await build_location_context(self.session_factory, curr_lat, curr_lng)
                instruction = f"{instruction}\n\n{loc_summary}"

            turn_ctx.add_message(role="system", content=instruction)

        except TimeoutError:
            logger.warning("Voice RAG timed out after %ss", self.settings.voice_rag_timeout_s)
            fallback = (
                "Knowledge lookup timed out. Ask a clarifying question; do not invent help steps."
                if is_support_portal(self.portal)
                else (
                    "Knowledge lookup timed out. Ask a clarifying question; "
                    "do not invent salon facts."
                )
            )
            turn_ctx.add_message(role="system", content=fallback)
        except Exception as exc:
            logger.exception("Voice RAG failed: %s", exc)
            turn_ctx.add_message(
                role="system",
                content="Knowledge lookup failed. Keep the reply short and honest.",
            )

    def _get_session(self) -> AsyncSession:
        """Get a database session."""
        return self.session_factory()


def initialize_location_from_metadata(
    ctx: Any,
    room: Any,
    location_tracker: LocationTracker,
) -> None:
    """Initialize location from job and room metadata."""
    job_meta = getattr(ctx.job, "metadata", None) if hasattr(ctx, "job") else None
    location_tracker.update_from_metadata(job_meta)

    if location_tracker.lat is None:
        location_tracker.update_from_metadata(getattr(room, "metadata", None))

    if location_tracker.lat is not None:
        logger.info(
            "Voice job user location resolved from metadata: lat=%s lng=%s",
            location_tracker.lat,
            location_tracker.lng,
        )


def setup_location_handlers(
    room: Any, location_tracker: LocationTracker, session_factory: Any
) -> None:
    """Set up event handlers for location updates."""
    # Check existing participants
    for p in room.remote_participants.values():
        location_tracker.update_from_metadata(getattr(p, "metadata", None))

    @room.on("participant_connected")
    def on_participant_connected(participant: Any):
        location_tracker.update_from_metadata(getattr(participant, "metadata", None))

    @room.on("participant_attributes_changed")
    def on_participant_attributes_changed(changed_attributes: Any, participant: Any):
        location_tracker.update_from_metadata(getattr(participant, "metadata", None))

    @room.on("data_received")
    def on_data_received(data_packet: Any):
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
                if (
                    isinstance(parsed, dict)
                    and parsed.get("type") in ("user_location", "location")
                    and location_tracker.update_from_metadata(parsed)
                ):
                    lat, lng = location_tracker.get()
                    if lat is not None and lng is not None:
                        asyncio.create_task(publish_nearby_orgs(room, session_factory, lat, lng))
        except Exception:
            pass


async def entrypoint(ctx: Any) -> None:
    """Main entry point for LiveKit voice worker."""
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
    job_meta = getattr(ctx.job, "metadata", None) if hasattr(ctx, "job") else None
    language = resolve_language(room_name, getattr(room, "metadata", None) or job_meta)
    portal = resolve_portal(room_name, getattr(room, "metadata", None) or job_meta)
    logger.info("Voice job room=%s language=%s portal=%s", room_name, language, portal)

    # Initialize location tracking
    location_tracker = LocationTracker()
    initialize_location_from_metadata(ctx, room, location_tracker)

    # Build session factory
    session_factory = build_session_factory()
    if not is_support_portal(portal):
        setup_location_handlers(room, location_tracker, session_factory)

    # Build tools (booking tools only for client portal)
    tools = build_voice_tools(
        session_factory,
        portal=portal,
        user_location_getter=location_tracker.get,
        on_auth_success=lambda p: publish_auth_success(room, p),
        on_booking_success=lambda p: publish_booking_success(room, p),
        on_discovery_results=lambda p: publish_discovery_results(room, p),
        on_ui_action=lambda p: publish_ui_action(room, p),
        on_payment_link=lambda p: publish_payment_link(room, p),
    )

    # Initialize agent
    agent = SalonVoiceAgent(
        language=language,
        session_factory=session_factory,
        location_tracker=location_tracker,
        settings=settings,
        tools=tools,
        room=room,
        portal=portal,
    )
    await agent.initialize()

    # Set up LiveKit components
    vad = ctx.proc.userdata.get("vad") or silero.VAD.load()
    if not settings.deepgram_api_key:
        raise RuntimeError("DEEPGRAM_API_KEY is required for the voice worker")

    stt = deepgram.STT(api_key=settings.deepgram_api_key)
    tts = deepgram.TTS(api_key=settings.deepgram_api_key)
    voice_llm = openai_compatible_llm()

    # Create and start agent session
    class LiveKitSalonAgent(Agent):
        def __init__(self):
            super().__init__(instructions=agent.initial_instructions, tools=tools)

        async def on_enter(self):
            await self.session.say(greeting_for(language, portal=portal))

        async def on_user_turn_completed(
            self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage
        ):
            await agent.handle_user_turn(turn_ctx, new_message)

    session = AgentSession(
        vad=vad,
        stt=stt,
        llm=voice_llm,
        tts=tts,
        preemptive_generation=False,
    )

    await session.start(
        agent=LiveKitSalonAgent(),
        room=room,
        room_input_options=RoomInputOptions(),
    )
