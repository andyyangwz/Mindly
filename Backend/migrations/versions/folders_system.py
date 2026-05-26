"""Create folders and journal_folders tables

Revision ID: h1i2j3k4l5m6
Revises: e6f5a4b3c2d1
Create Date: 2026-05-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "h1i2j3k4l5m6"
down_revision: Union[str, None] = "e6f5a4b3c2d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table("folders",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("user_id", postgresql.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("emoji", sa.String(length=10), nullable=True, server_default="📁"),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_folders_user_id"), "folders", ["user_id"], unique=False)

    op.create_table("journal_folders",
        sa.Column("journal_id", postgresql.UUID(), nullable=False),
        sa.Column("folder_id", postgresql.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["folder_id"], ["folders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["journal_id"], ["journals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("journal_id", "folder_id"),
    )
    op.create_index(op.f("ix_journal_folders_journal_id"), "journal_folders", ["journal_id"], unique=False)
    op.create_index(op.f("ix_journal_folders_folder_id"), "journal_folders", ["folder_id"], unique=False)


def downgrade() -> None:
    op.drop_table("journal_folders")
    op.drop_table("folders")
