"""Drop productivity_events table

Revision ID: f1a2b3c4d5e6
Revises: d5e6f7a8b9c0
Create Date: 2026-07-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "d5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    conn = op.get_bind()

    # Verify migration is complete before dropping
    pe_count = conn.execute(sa.text(
        "SELECT COUNT(*) FROM productivity_events"
    )).scalar()

    activities_count = conn.execute(sa.text(
        "SELECT COUNT(*) FROM activities"
    )).scalar()

    tasks_count = conn.execute(sa.text(
        "SELECT COUNT(*) FROM tasks"
    )).scalar()

    if pe_count != (activities_count + tasks_count):
        raise RuntimeError(
            f"Cannot drop productivity_events: row count mismatch. "
            f"productivity_events={pe_count}, "
            f"activities+tasks={activities_count + tasks_count}. "
            f"Data migration may be incomplete."
        )

    op.drop_table("productivity_events")


def downgrade():
    op.create_table(
        "productivity_events",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, server_default=""),
        sa.Column("start_datetime", sa.DateTime, nullable=False),
        sa.Column("end_datetime", sa.DateTime, nullable=False),
        sa.Column("color", sa.String(7), server_default="#7C3AED"),
        sa.Column("priority", sa.String(10), server_default="medium"),
        sa.Column("productivity_level", sa.String(20), server_default="neutral"),
        sa.Column("has_deadline", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("status", sa.String(20), nullable=False, server_default="To Do"),
        sa.Column("status_change_at", sa.DateTime, nullable=True),
        sa.Column("progress", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )
