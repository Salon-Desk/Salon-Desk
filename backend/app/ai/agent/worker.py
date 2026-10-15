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

from app.ai.agent.prompts import INSTRUCTIONS_EN, greeting_for, is_farewell
from app.ai.rag_service import build_voice_rag_instruction, detect_intent, retrieve_context
from app.ai.tools import build_voice_tools
from app.core.config import get_settings
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

    session_factory = _build_session_factory()
    tools = build_voice_tools(session_factory)

    vad = ctx.proc.userdata.get("vad") or silero.VAD.load()
    if not settings.deepgram_api_key:
        raise RuntimeError("DEEPGRAM_API_KEY is required for the voice worker")

    stt = deepgram.STT(api_key=settings.deepgram_api_key)
    tts = deepgram.TTS(api_key=settings.deepgram_api_key)
    voice_llm = _openai_compatible_llm()

    class SalonVoiceAgent(Agent):
        def __init__(self) -> None:
            super().__init__(instructions=INSTRUCTIONS_EN, tools=tools)

        async def on_enter(self) -> None:
            await self.session.say(greeting_for(language))

        async def on_user_turn_completed(
            self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage
        ) -> None:
            text = (new_message.text_content or "").strip()
            if _is_garbage_transcript(text):
                return

            if is_farewell(text):
                turn_ctx.add_message(
                    role="system",
                    content="The user is ending the call. Say a brief goodbye and stop.",
                )
                return

            intent = detect_intent(text)
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
                        ),
                        timeout=settings.voice_rag_timeout_s,
                    )
                # Force booking intent if classifier says so (even if RAG guessed discover)
                if intent == "booking":
                    retrieved.intent = "booking"
                turn_ctx.add_message(
                    role="system",
                    content=build_voice_rag_instruction(retrieved),
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
