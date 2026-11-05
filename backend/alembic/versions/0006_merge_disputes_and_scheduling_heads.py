"""Merge disputes and scheduling migration heads.

Revision ID: 0006_merge_heads
Revises: 0003_disputes_slot_rescue, 0005_scheduling_staff
Create Date: 2026-11-05
"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
# Must be <= 32 chars (alembic_version.version_num VARCHAR(32)).
revision: str = "0006_merge_heads"
down_revision: str | tuple[str, ...] | None = (
    "0003_disputes_slot_rescue",
    "0005_scheduling_staff",
)
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
