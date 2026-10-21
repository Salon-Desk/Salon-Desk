"""Initial schema migration.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-10-21
"""

import contextlib
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

import app.models  # noqa: F401
from app.core.database import Base

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    with contextlib.suppress(Exception):
        conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector;"))
    Base.metadata.create_all(bind=conn)


def downgrade() -> None:
    conn = op.get_bind()
    Base.metadata.drop_all(bind=conn)
