"""Add handle column to profile table.

Revision ID: 0004_user_profile_handle
Revises: 0003_service_category_status
Create Date: 2026-10-28
"""

import contextlib
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_user_profile_handle"
down_revision: str | None = "0003_service_category_status"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text("ALTER TABLE profile ADD COLUMN IF NOT EXISTS handle VARCHAR(64) UNIQUE;")
        )
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_profile_handle ON profile(handle);")
        )


def downgrade() -> None:
    conn = op.get_bind()
    with contextlib.suppress(Exception):
        conn.execute(sa.text("DROP INDEX IF EXISTS ix_profile_handle;"))
    with contextlib.suppress(Exception):
        conn.execute(sa.text("ALTER TABLE profile DROP COLUMN IF EXISTS handle;"))
