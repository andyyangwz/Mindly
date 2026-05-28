"""Remove event_date, start_time, end_time columns — start_datetime/end_datetime only

Revision ID: a1b2c3d4e5f6
Revises: e6f5a4b3c2d1
Create Date: 2026-05-27

"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "e6f5a4b3c2d1"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("productivity_events", schema=None) as batch_op:
        batch_op.drop_column("event_date")
        batch_op.drop_column("start_time")
        batch_op.drop_column("end_time")
        batch_op.alter_column("start_datetime", nullable=False)
        batch_op.alter_column("end_datetime", nullable=False)


def downgrade():
    with op.batch_alter_table("productivity_events", schema=None) as batch_op:
        batch_op.add_column(sa.Column("event_date", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("start_time", sa.Time(), nullable=True))
        batch_op.add_column(sa.Column("end_time", sa.Time(), nullable=True))
        batch_op.alter_column("start_datetime", nullable=True)
        batch_op.alter_column("end_datetime", nullable=True)
