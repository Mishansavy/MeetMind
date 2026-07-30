"""add recordings

Revision ID: f3a1c9d2e8b4
Revises: 02dedb9a84d9
Create Date: 2026-07-30 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a1c9d2e8b4'
down_revision: Union[str, Sequence[str], None] = '02dedb9a84d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'recordings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_recordings_id'), 'recordings', ['id'], unique=False)
    op.create_index(op.f('ix_recordings_room_id'), 'recordings', ['room_id'], unique=False)
    op.create_index(op.f('ix_recordings_user_id'), 'recordings', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_recordings_user_id'), table_name='recordings')
    op.drop_index(op.f('ix_recordings_room_id'), table_name='recordings')
    op.drop_index(op.f('ix_recordings_id'), table_name='recordings')
    op.drop_table('recordings')
