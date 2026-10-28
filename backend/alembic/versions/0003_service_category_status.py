"""Add status column to service_category table.

Revision ID: 0003_service_category_status
Revises: 0002_pending_payment_status
Create Date: 2026-10-27
"""

import contextlib
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_service_category_status"
down_revision: str | None = "0002_pending_payment_status"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text(
                "ALTER TABLE service_category ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE';"
            )
        )


def downgrade() -> None:
    conn = op.get_bind()
    with contextlib.suppress(Exception):
        conn.execute(sa.text("ALTER TABLE service_category DROP COLUMN IF EXISTS status;"))
