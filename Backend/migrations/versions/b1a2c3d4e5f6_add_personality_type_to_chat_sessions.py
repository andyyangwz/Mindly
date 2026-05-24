"""add personality_type to chat_sessions

Revision ID: b1a2c3d4e5f6
Revises: 093f11a9b8c0
Create Date: 2026-05-17
"""
from alembic import op
import sqlalchemy as sa

revision = "b1a2c3d4e5f6"
down_revision = "093f11a9b8c0"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "chat_sessions",
        sa.Column("personality_type", sa.String(30), nullable=True, server_default="empathetic"),
    )
    # Backfill existing rows with default
    op.execute("UPDATE chat_sessions SET personality_type = 'empathetic' WHERE personality_type IS NULL")


def downgrade():
    op.drop_column("chat_sessions", "personality_type")
