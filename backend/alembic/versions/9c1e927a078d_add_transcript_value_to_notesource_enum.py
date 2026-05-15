"""add transcript value to notesource enum

Revision ID: 9c1e927a078d
Revises: 18ad03b711b7
Create Date: 2026-05-15 06:52:23.335377

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c1e927a078d'
down_revision: Union[str, Sequence[str], None] = '18ad03b711b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notesource ADD VALUE IF NOT EXISTS 'transcript'")


def downgrade() -> None:
    # Enum values cannot be removed in PostgreSQL without recreating the type.
    pass
