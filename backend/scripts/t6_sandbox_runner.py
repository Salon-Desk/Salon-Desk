"""Standalone runner for PayPal money-flow verification."""

import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run() -> None:
    logger.info("T6 sandbox runner (stub)")


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()
