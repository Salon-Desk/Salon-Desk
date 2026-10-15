#!/usr/bin/env python3
"""SalonDesk LiveKit voice worker entrypoint.

Run as a separate long-lived process (not inside uvicorn):

  cd backend && uv run python agent.py start

Requires LIVEKIT_* and DEEPGRAM_API_KEY (and Ollama embed model for RAG).
"""

from __future__ import annotations

import logging

logging.basicConfig(level=logging.INFO)


def main() -> None:
    import os

    from livekit.agents import WorkerOptions, cli

    from app.ai.agent.worker import entrypoint, prewarm
    from app.core.config import get_settings

    settings = get_settings()
    port = int(os.environ.get("LIVEKIT_WORKER_PORT", "0"))
    agent_name = settings.livekit_agent_name
    # LiveKit SDK falls back to the LIVEKIT_AGENT_NAME env var when WorkerOptions
    # agent_name is empty; keep them aligned so token dispatch can find this worker.
    os.environ["LIVEKIT_AGENT_NAME"] = agent_name
    logging.getLogger("salondesk.voice").info("LiveKit worker agent_name=%s", agent_name)
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            api_key=settings.livekit_api_key or None,
            api_secret=settings.livekit_api_secret or None,
            ws_url=settings.livekit_url or None,
            agent_name=agent_name,
            port=port,
        )
    )


if __name__ == "__main__":
    main()
