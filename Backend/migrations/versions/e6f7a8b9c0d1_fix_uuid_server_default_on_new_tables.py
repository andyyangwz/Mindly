"""Add server_default gen_random_uuid() to id columns in new tables

Revision ID: e6f7a8b9c0d1
Revises: c4d5e6f7a8b9
Create Date: 2026-07-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    for table in ("activities", "tasks", "reminders"):
        op.alter_column(
            table,
            "id",
            server_default=sa.text("gen_random_uuid()"),
        )


def downgrade():
    for table in ("activities", "tasks", "reminders"):
        op.alter_column(
            table,
            "id",
            server_default=None,
        )
