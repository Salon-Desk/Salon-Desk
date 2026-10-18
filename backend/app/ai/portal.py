"""Portal-aware assistant modes: client booking vs org/admin support."""

from __future__ import annotations

from typing import Literal

from app.models.enums import KnowledgeEntityType

AssistantPortal = Literal["client", "merchant", "admin"]

VALID_PORTALS: frozenset[str] = frozenset({"client", "merchant", "admin"})


def normalize_portal(value: str | None) -> AssistantPortal:
    if value in VALID_PORTALS:
        return value  # type: ignore[return-value]
    return "client"


def is_support_portal(portal: str | None) -> bool:
    return normalize_portal(portal) in {"merchant", "admin"}


def entity_types_for_portal(portal: str | None) -> list[KnowledgeEntityType]:
    """Which knowledge_chunk entity types each assistant may retrieve."""
    mode = normalize_portal(portal)
    if mode == "merchant":
        return [
            KnowledgeEntityType.ORG_GUIDE,
            KnowledgeEntityType.PLATFORM,
            KnowledgeEntityType.POLICY,
        ]
    if mode == "admin":
        return [
            KnowledgeEntityType.ADMIN_GUIDE,
            KnowledgeEntityType.PLATFORM,
        ]
    return [
        KnowledgeEntityType.SERVICE,
        KnowledgeEntityType.ORGANIZATION,
        KnowledgeEntityType.CATEGORY,
        KnowledgeEntityType.POLICY,
        KnowledgeEntityType.PLATFORM,
    ]
