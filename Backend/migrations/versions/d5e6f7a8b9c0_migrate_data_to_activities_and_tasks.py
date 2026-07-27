"""Copy productivity_events data into activities and tasks tables

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-07-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "e6f7a8b9c0d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    conn = op.get_bind()

    # --- Migrate Activities (has_deadline = FALSE) ---
    conn.execute(sa.text("""
        INSERT INTO activities
            (user_id, title, description, start_datetime, end_datetime,
             color, productivity_level, status, created_at, updated_at)
        SELECT
            user_id, title, description, start_datetime, end_datetime,
            color, productivity_level, status, created_at, updated_at
        FROM productivity_events
        WHERE has_deadline = FALSE
    """))

    # --- Migrate Tasks (has_deadline = TRUE) ---
    conn.execute(sa.text("""
        INSERT INTO tasks
            (user_id, title, description, start_datetime, deadline_datetime,
             color, priority, status, status_changed_at, progress,
             created_at, updated_at)
        SELECT
            user_id, title, description, start_datetime, end_datetime,
            color, priority, status, status_change_at, progress,
            created_at, updated_at
        FROM productivity_events
        WHERE has_deadline = TRUE
    """))

    # --- Validation ---
    pe_activity_count = conn.execute(sa.text(
        "SELECT COUNT(*) FROM productivity_events WHERE has_deadline = FALSE"
    )).scalar()
    activities_count = conn.execute(sa.text(
        "SELECT COUNT(*) FROM activities"
    )).scalar()

    pe_task_count = conn.execute(sa.text(
        "SELECT COUNT(*) FROM productivity_events WHERE has_deadline = TRUE"
    )).scalar()
    tasks_count = conn.execute(sa.text(
        "SELECT COUNT(*) FROM tasks"
    )).scalar()

    reminders_count = conn.execute(sa.text(
        "SELECT COUNT(*) FROM reminders"
    )).scalar()

    errors = []
    if activities_count != pe_activity_count:
        errors.append(
            f"Activities count mismatch: expected {pe_activity_count}, got {activities_count}"
        )
    if tasks_count != pe_task_count:
        errors.append(
            f"Tasks count mismatch: expected {pe_task_count}, got {tasks_count}"
        )
    if reminders_count != 0:
        errors.append(
            f"Reminders should be empty, got {reminders_count} rows"
        )
    if errors:
        raise RuntimeError(
            "Data migration validation failed:\n" + "\n".join(errors)
        )


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM activities"))
    conn.execute(sa.text("DELETE FROM tasks"))
