"""Populate realistic initial demo data (Selam Hair Studio, staff, slots)."""

import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed() -> None:
    logger.info("Seeding demo data (stub) — Selam Hair Studio")
    # TODO: insert org, staff, services, sample slots


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
