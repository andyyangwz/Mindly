"""add deadline_date and deadline_time columns to productivity_events

Revision ID: d4e5f6a7b8c9
Revises: c2d3e4f5g6h7
Create Date: 2026-05-17
"""
from alembic import op
import sqlalchemy as sa

revision = "d4e5f6a7b8c9"
down_revision = "093f11a9b8c0"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('productivity_events') as batch_op:
        batch_op.add_column(sa.Column('deadline_date', sa.Date(), nullable=True))
        batch_op.add_column(sa.Column('deadline_time', sa.Time(), nullable=True))


def downgrade():
    with op.batch_alter_table('productivity_events') as batch_op:
        batch_op.drop_column('deadline_time')
        batch_op.drop_column('deadline_date')
