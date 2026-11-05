"""Add scheduling weekly days, employee time off, and staff service categories.

Revision ID: 0005_scheduling_and_staff_capabilities
Revises: 0004_user_profile_handle
Create Date: 2026-10-28
"""

import contextlib
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005_scheduling_staff"
down_revision: str | None = "0004_user_profile_handle"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text(
                'ALTER TABLE org_employee_shift ADD COLUMN IF NOT EXISTS days JSONB NOT NULL DEFAULT \'["monday","tuesday","wednesday","thursday","friday"]\';'
            )
        )
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text(
                """
                CREATE TABLE IF NOT EXISTS org_employee_time_off (
                    id UUID PRIMARY KEY,
                    org_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    reason VARCHAR(255),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
        )
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text(
                "CREATE INDEX IF NOT EXISTS ix_org_employee_time_off_org_id ON org_employee_time_off(org_id);"
            )
        )
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text(
                "CREATE INDEX IF NOT EXISTS ix_org_employee_time_off_user_id ON org_employee_time_off(user_id);"
            )
        )
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text(
                """
                CREATE TABLE IF NOT EXISTS org_employee_category (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                    service_category_id UUID NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    CONSTRAINT uq_org_employee_category UNIQUE (user_id, service_category_id)
                );
                """
            )
        )
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text(
                "CREATE INDEX IF NOT EXISTS ix_org_employee_category_user_id ON org_employee_category(user_id);"
            )
        )
    with contextlib.suppress(Exception):
        conn.execute(
            sa.text(
                "CREATE INDEX IF NOT EXISTS ix_org_employee_category_cat_id ON org_employee_category(service_category_id);"
            )
        )


def downgrade() -> None:
    conn = op.get_bind()
    with contextlib.suppress(Exception):
        conn.execute(sa.text("DROP TABLE IF EXISTS org_employee_category CASCADE;"))
    with contextlib.suppress(Exception):
        conn.execute(sa.text("DROP TABLE IF EXISTS org_employee_time_off CASCADE;"))
    with contextlib.suppress(Exception):
        conn.execute(sa.text("ALTER TABLE org_employee_shift DROP COLUMN IF EXISTS days;"))
