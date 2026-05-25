"""add last_message_at to chat_sessions

Revision ID: a2b3c4d5e6f7
Revises: d1e2f3a4b5c6
Create Date: 2026-05-25
"""
from alembic import op
import sqlalchemy as sa

revision = "a2b3c4d5e6f7"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "chat_sessions",
        sa.Column("last_message_at", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_column("chat_sessions", "last_message_at")
