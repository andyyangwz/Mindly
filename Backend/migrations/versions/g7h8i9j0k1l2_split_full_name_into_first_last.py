"""Split full_name into first_name + last_name, migrate existing data

Revision ID: g7h8i9j0k1l2
Revises: f7e8d9c0b1a2
Create Date: 2026-05-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import text

revision = 'g7h8i9j0k1l2'
down_revision = 'f7e8d9c0b1a2'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add first_name and last_name columns (allow NULL initially for migration)
    op.add_column('users', sa.Column('first_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(255), nullable=True))

    # Step 2: Migrate existing full_name data
    # Split on first space: "Andy Yang" → first_name="Andy", last_name="Yang"
    # For names without a space, the entire name becomes first_name and last_name is empty
    conn = op.get_bind()
    conn.execute(
        text("""
            UPDATE users
            SET
                first_name = CASE
                    WHEN POSITION(' ' IN full_name) > 0
                    THEN SUBSTRING(full_name FROM 1 FOR POSITION(' ' IN full_name) - 1)
                    ELSE full_name
                END,
                last_name = CASE
                    WHEN POSITION(' ' IN full_name) > 0
                    THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
                    ELSE ''
                END
        """)
    )

    # Step 3: Make columns NOT NULL now that data is migrated
    op.alter_column('users', 'first_name', nullable=False)
    op.alter_column('users', 'last_name', nullable=False)

    # Step 4: Remove full_name column
    op.drop_column('users', 'full_name')


def downgrade():
    op.add_column('users', sa.Column('full_name', sa.String(255), nullable=True))

    conn = op.get_bind()
    conn.execute(
        text("""
            UPDATE users
            SET full_name = TRIM(
                COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
            )
        """)
    )

    op.alter_column('users', 'full_name', nullable=False)
    op.drop_column('users', 'first_name')
    op.drop_column('users', 'last_name')
