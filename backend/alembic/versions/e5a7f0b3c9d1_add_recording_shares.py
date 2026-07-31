"""add recording shares

Revision ID: e5a7f0b3c9d1
Revises: c8f2b5a9d1e7
Create Date: 2026-07-31 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5a7f0b3c9d1'
down_revision: Union[str, Sequence[str], None] = 'c8f2b5a9d1e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'recording_shares',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recording_id', sa.Integer(), nullable=False),
        sa.Column('shared_with_user_id', sa.Integer(), nullable=False),
        sa.Column('shared_by_user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['recording_id'], ['recordings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_with_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_by_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_recording_shares_id'), 'recording_shares', ['id'], unique=False)
    op.create_index(op.f('ix_recording_shares_recording_id'), 'recording_shares', ['recording_id'], unique=False)
    op.create_index(op.f('ix_recording_shares_shared_with_user_id'), 'recording_shares', ['shared_with_user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_recording_shares_shared_with_user_id'), table_name='recording_shares')
    op.drop_index(op.f('ix_recording_shares_recording_id'), table_name='recording_shares')
    op.drop_index(op.f('ix_recording_shares_id'), table_name='recording_shares')
    op.drop_table('recording_shares')
