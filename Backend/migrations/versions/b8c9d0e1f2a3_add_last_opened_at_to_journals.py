"""Add last_opened_at to journals

Revision ID: b8c9d0e1f2a3
Revises: f1a2b3c4d5e6
Create Date: 2026-07-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("journals", sa.Column("last_opened_at", sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column("journals", "last_opened_at")
