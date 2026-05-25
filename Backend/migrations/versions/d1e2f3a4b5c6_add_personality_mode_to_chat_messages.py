"""add personality_mode to chat_messages

Revision ID: d1e2f3a4b5c6
Revises: f0a1b2c3d4e5
Create Date: 2026-05-25
"""
from alembic import op
import sqlalchemy as sa

revision = "d1e2f3a4b5c6"
down_revision = "f0a1b2c3d4e5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "chat_messages",
        sa.Column("personality_mode", sa.String(30), nullable=True),
    )


def downgrade():
    op.drop_column("chat_messages", "personality_mode")
