"""Monitor payment_hold.honor_expires_at and void expired holds."""

import asyncio
import logging

logger = logging.getLogger(__name__)


async def run_hold_expiration_loop(*, interval_seconds: float = 60.0) -> None:
    while True:
        try:
            await tick()
        except Exception:
            logger.exception("Hold expiration tick failed")
        await asyncio.sleep(interval_seconds)


async def tick() -> None:
    logger.debug("hold expiration tick")
