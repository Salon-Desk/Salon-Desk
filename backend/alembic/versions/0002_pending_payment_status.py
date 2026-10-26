"""Add PENDING_PAYMENT to booking_status enum.

Revision ID: 0002_pending_payment_status
Revises: 0001_initial_schema
Create Date: 2026-10-25
"""

import contextlib
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_pending_payment_status"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text("ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';")
        )


def downgrade() -> None:
    pass
