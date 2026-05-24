"""add productivity fields: level, deadline, task_group

Revision ID: af37a902573e
Revises: 4eb1172085b4
Create Date: 2026-05-15 15:54:30.266237

"""
from alembic import op
import sqlalchemy as sa
revision = 'af37a902573e'
down_revision = '4eb1172085b4'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('productivity_events') as batch_op:
        batch_op.add_column(sa.Column('productivity_level', sa.String(length=20), server_default='neutral'))
        batch_op.add_column(sa.Column('has_deadline', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.add_column(sa.Column('is_deadline_marker', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.add_column(sa.Column('task_group_id', sa.UUID(), nullable=True))
        batch_op.create_index('ix_productivity_events_task_group_id', ['task_group_id'])


def downgrade():
    with op.batch_alter_table('productivity_events') as batch_op:
        batch_op.drop_index('ix_productivity_events_task_group_id')
        batch_op.drop_column('task_group_id')
        batch_op.drop_column('is_deadline_marker')
        batch_op.drop_column('has_deadline')
        batch_op.drop_column('productivity_level')
