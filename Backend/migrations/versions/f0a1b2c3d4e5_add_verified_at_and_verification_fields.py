"""add verified_at and verification fields

Revision ID: f0a1b2c3d4e5
Revises: e5f6g7h8i9j0
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "f0a1b2c3d4e5"
down_revision = "g7h8i9j0k1l2"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("verified_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("verification_token", sa.String(length=128), nullable=True))
    op.add_column("users", sa.Column("verification_token_expires_at", sa.DateTime(), nullable=True))
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)
    op.create_unique_constraint(None, "users", ["verification_token"])


def downgrade():
    op.drop_constraint(None, "users", type_="unique")
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
    op.drop_column("users", "verification_token_expires_at")
    op.drop_column("users", "verification_token")
    op.drop_column("users", "verified_at")
