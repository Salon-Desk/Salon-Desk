"""Incremental RAG re-indexing when catalog or policy data changes."""

import logging

logger = logging.getLogger(__name__)


async def sync_knowledge_for_org(org_id: str) -> None:
    logger.info("knowledge sync queued for org %s", org_id)
