"""add employee fields to users

Revision ID: b7e4d1f6a2c9
Revises: f3a1c9d2e8b4
Create Date: 2026-07-30 10:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e4d1f6a2c9'
down_revision: Union[str, Sequence[str], None] = 'f3a1c9d2e8b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('employee_id', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('department', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('designation', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('join_date', sa.Date(), nullable=True))
    op.create_unique_constraint('uq_users_employee_id', 'users', ['employee_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_users_employee_id', 'users', type_='unique')
    op.drop_column('users', 'join_date')
    op.drop_column('users', 'designation')
    op.drop_column('users', 'department')
    op.drop_column('users', 'employee_id')
