"""Add supervity_runs table

Revision ID: d4e5f6g7h8i9
Revises: c3d4e5f6g7h8
Create Date: 2026-08-08 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d4e5f6g7h8i9"
down_revision: Union[str, None] = "c3d4e5f6g7h8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "supervity_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("workflow_id", sa.String(length=255), nullable=False),
        sa.Column("workflow_name", sa.String(length=255), nullable=True),
        sa.Column("inputs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="triggered"),
        sa.Column("supervity_run_id", sa.String(length=255), nullable=True),
        sa.Column("outputs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("triggered_by", sa.String(length=255), nullable=True),
        sa.Column("trigger_source", sa.String(length=100), nullable=True),
        sa.Column(
            "triggered_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_supervity_runs_id", "supervity_runs", ["id"], unique=False)
    op.create_index("ix_supervity_runs_workflow_id", "supervity_runs", ["workflow_id"], unique=False)
    op.create_index("ix_supervity_runs_status", "supervity_runs", ["status"], unique=False)
    op.create_index("ix_supervity_runs_supervity_run_id", "supervity_runs", ["supervity_run_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_supervity_runs_supervity_run_id", table_name="supervity_runs")
    op.drop_index("ix_supervity_runs_status", table_name="supervity_runs")
    op.drop_index("ix_supervity_runs_workflow_id", table_name="supervity_runs")
    op.drop_index("ix_supervity_runs_id", table_name="supervity_runs")
    op.drop_table("supervity_runs")
