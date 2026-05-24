"""merge chat and productivity branches + add status_change_at

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6a7b8c9, c2d3e4f5g6h7
Create Date: 2026-05-17
"""
from alembic import op
import sqlalchemy as sa

revision = "e5f6g7h8i9j0"
down_revision = ("d4e5f6a7b8c9", "c2d3e4f5g6h7")
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "productivity_events",
        sa.Column("status_change_at", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_column("productivity_events", "status_change_at")
