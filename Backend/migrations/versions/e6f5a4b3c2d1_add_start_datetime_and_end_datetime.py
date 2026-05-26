"""Add start_datetime and end_datetime columns for cross-day activities

Revision ID: e6f5a4b3c2d1
Revises: a2b3c4d5e6f7
Create Date: 2026-05-25

"""
from datetime import datetime, time, timedelta
from alembic import op
import sqlalchemy as sa

revision = "e6f5a4b3c2d1"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    op.add_column("productivity_events", sa.Column("start_datetime", sa.DateTime(), nullable=True))
    op.add_column("productivity_events", sa.Column("end_datetime", sa.DateTime(), nullable=True))

    rows = conn.execute(
        sa.text(
            "SELECT id, event_date, start_time, end_time FROM productivity_events "
            "WHERE start_datetime IS NULL"
        )
    ).fetchall()

    for row in rows:
        event_id = row[0]
        event_date = row[1]
        start_time = row[2]
        end_time = row[3]

        if start_time and end_time and event_date:
            start_dt = datetime.combine(event_date, start_time)
            end_dt = datetime.combine(event_date, end_time)

            if end_dt <= start_dt:
                end_dt += timedelta(days=1)

            conn.execute(
                sa.text(
                    "UPDATE productivity_events SET start_datetime = :sd, end_datetime = :ed WHERE id = :eid"
                ),
                {"sd": start_dt, "ed": end_dt, "eid": event_id},
            )


def downgrade():
    op.drop_column("productivity_events", "end_datetime")
    op.drop_column("productivity_events", "start_datetime")
