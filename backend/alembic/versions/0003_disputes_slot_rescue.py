"""Add DisputeCase and WaitlistEntry tables.

Revision ID: 0003_disputes_slot_rescue
Revises: 0002_pending_payment_status
Create Date: 2026-10-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

import app.models  # noqa: F401
from app.core.database import Base

revision: str = "0003_disputes_slot_rescue"
down_revision: str | None = "0002_pending_payment_status"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    # Create enum types if not exists safely without aborting transaction
    enum_defs = [
        (
            "dispute_case_status",
            [
                "OPEN",
                "INVESTIGATING",
                "EVIDENCE_READY",
                "WAITING_FOR_SELLER_RESPONSE",
                "EVIDENCE_SUBMITTED",
                "UNDER_REVIEW",
                "OFFER_MADE",
                "RESOLVED_SELLER_FAVOR",
                "RESOLVED_BUYER_FAVOR",
            ],
        ),
        ("dispute_recommendation", ["FILE_EVIDENCE", "MAKE_OFFER"]),
        ("waitlist_status", ["WAITING", "OFFERED", "RESCUED_FILLED", "EXPIRED"]),
    ]
    for enum_name, values in enum_defs:
        val_str = ", ".join(f"'{v}'" for v in values)
        conn.execute(
            sa.text(
                f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{enum_name}') THEN
                        CREATE TYPE {enum_name} AS ENUM ({val_str});
                    END IF;
                END$$;
                """
            )
        )

    # Create tables if not existing
    target_tables = [
        Base.metadata.tables["dispute_case"],
        Base.metadata.tables["waitlist_entry"],
    ]
    Base.metadata.create_all(bind=conn, tables=target_tables, checkfirst=True)


def downgrade() -> None:
    conn = op.get_bind()
    target_tables = [
        Base.metadata.tables["dispute_case"],
        Base.metadata.tables["waitlist_entry"],
    ]
    Base.metadata.drop_all(bind=conn, tables=target_tables)
