"""Polling worker: grace periods and Day-4+ reauthorizations."""

import asyncio
import logging

logger = logging.getLogger(__name__)


async def run_scheduler_loop(*, interval_seconds: float = 60.0) -> None:
    while True:
        try:
            await tick()
        except Exception:
            logger.exception("Scheduler tick failed")
        await asyncio.sleep(interval_seconds)


async def tick() -> None:
    # Placeholder for grace-period and reauth checks
    logger.debug("scheduler tick")
