"""Add is_equipped and equipped_order to habit_goals

Revision ID: 1a2b3c4d5e6f
Revises: 0e359f7b5939
Create Date: 2026-05-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import text

revision = '1a2b3c4d5e6f'
down_revision = '0e359f7b5939'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('habit_goals', sa.Column(
        'is_equipped', sa.Boolean(), nullable=False, server_default=sa.text('false')
    ))
    op.add_column('habit_goals', sa.Column(
        'equipped_order', sa.Integer(), nullable=True
    ))

    op.execute("""
        WITH ranked AS (
            SELECT id, ROW_NUMBER() OVER (
                PARTITION BY user_id ORDER BY created_at ASC
            ) - 1 AS rn
            FROM habit_goals
        )
        UPDATE habit_goals
        SET is_equipped = true,
            equipped_order = ranked.rn
        FROM ranked
        WHERE habit_goals.id = ranked.id
          AND ranked.rn < 3
    """)


def downgrade():
    op.drop_column('habit_goals', 'equipped_order')
    op.drop_column('habit_goals', 'is_equipped')
