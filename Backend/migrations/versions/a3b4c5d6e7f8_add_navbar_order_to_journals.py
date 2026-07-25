"""Add navbar_order to journals

Revision ID: a3b4c5d6e7f8
Revises: fd4fa1370f9a
Create Date: 2026-07-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a3b4c5d6e7f8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("journals", sa.Column("navbar_order", sa.Integer(), nullable=True))


def downgrade():
    op.drop_column("journals", "navbar_order")
