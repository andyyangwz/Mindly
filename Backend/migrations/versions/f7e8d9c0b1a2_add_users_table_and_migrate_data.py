"""Add users table, seed Andy Yang, migrate existing data, add FK constraints

Revision ID: f7e8d9c0b1a2
Revises: 1a2b3c4d5e6f
Create Date: 2026-05-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import text
import uuid

revision = 'f7e8d9c0b1a2'
down_revision = '1a2b3c4d5e6f'
branch_labels = None
depends_on = None

SEEDED_USER_ID = "550e8400-e29b-41d4-a716-446655440000"


def upgrade():
    # Step 1: Create users table (no FK constraints yet)
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('username', sa.String(80), unique=True, nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_email', 'users', ['email'])

    # Step 2: Compute bcrypt hash for "admin" and insert seeded user
    import bcrypt
    pw_hash = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode("utf-8")

    conn = op.get_bind()
    conn.execute(
        text("""
            INSERT INTO users (id, full_name, username, email, password_hash, created_at, updated_at)
            VALUES (:id, :full_name, :username, :email, :password_hash, NOW(), NOW())
        """),
        {
            "id": uuid.UUID(SEEDED_USER_ID),
            "full_name": "Andy Yang",
            "username": "andyyang",
            "email": "andyyangwz@gmail.com",
            "password_hash": pw_hash,
        }
    )

    # Step 3: Migrate ALL existing data to the seeded user
    # This handles all user_id values, including NULL and any orphaned UUIDs.
    tables = ['journals', 'productivity_events', 'chat_sessions', 'habit_goals']
    for table in tables:
        conn.execute(
            text(f"UPDATE {table} SET user_id = :target_id WHERE user_id IS DISTINCT FROM :target_id"),
            {"target_id": uuid.UUID(SEEDED_USER_ID)}
        )

    # Step 4: Add foreign key constraints
    # These must come AFTER the data migration so existing rows satisfy the FK.
    op.create_foreign_key(
        'fk_journals_user_id', 'journals', 'users',
        ['user_id'], ['id']
    )
    op.create_foreign_key(
        'fk_productivity_events_user_id', 'productivity_events', 'users',
        ['user_id'], ['id']
    )
    op.create_foreign_key(
        'fk_chat_sessions_user_id', 'chat_sessions', 'users',
        ['user_id'], ['id']
    )
    op.create_foreign_key(
        'fk_habit_goals_user_id', 'habit_goals', 'users',
        ['user_id'], ['id']
    )


def downgrade():
    op.drop_constraint('fk_habit_goals_user_id', 'habit_goals', type_='foreignkey')
    op.drop_constraint('fk_chat_sessions_user_id', 'chat_sessions', type_='foreignkey')
    op.drop_constraint('fk_productivity_events_user_id', 'productivity_events', type_='foreignkey')
    op.drop_constraint('fk_journals_user_id', 'journals', type_='foreignkey')
    op.drop_table('users')
