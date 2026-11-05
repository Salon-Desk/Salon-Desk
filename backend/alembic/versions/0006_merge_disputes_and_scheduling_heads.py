"""Merge disputes and scheduling migration heads.

Revision ID: 0006_merge_disputes_and_scheduling
Revises: 0003_disputes_slot_rescue, 0005_scheduling_staff
Create Date: 2026-11-05
"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "0006_merge_disputes_and_scheduling"
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
