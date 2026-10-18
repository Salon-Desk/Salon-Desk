"""Semantic search index for AI discovery and support (chat + voice).

Client assistants ground recommendations in live catalog entities.
Merchant/admin assistants retrieve ``org_guide`` / ``admin_guide`` how-to chunks.
"""

from __future__ import annotations

import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TimestampedModel
from app.models.enums import KnowledgeEntityType

EMBEDDING_DIMS = 384


class KnowledgeChunk(TimestampedModel):
    __tablename__ = "knowledge_chunk"

    entity_type: Mapped[KnowledgeEntityType] = mapped_column(
        Enum(
            KnowledgeEntityType,
            name="knowledge_entity_type",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        index=True,
    )
    # Soft reference to service / organization / category / policy id
    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    # Org scope for multi-tenant isolation (null = platform-wide)
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organization.id"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(8), nullable=False, index=True)
    embedding = mapped_column(Vector(EMBEDDING_DIMS), nullable=True)
    # Card / filter payload: price, duration, address, category_name, …
    metadata_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
