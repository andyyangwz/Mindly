"""add journal_context to chat_messages

Revision ID: c2d3e4f5g6h7
Revises: b1a2c3d4e5f6
Create Date: 2026-05-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = "c2d3e4f5g6h7"
down_revision = "b1a2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "chat_messages",
        sa.Column("journal_context", JSON, nullable=True),
    )


def downgrade():
    op.drop_column("chat_messages", "journal_context")
