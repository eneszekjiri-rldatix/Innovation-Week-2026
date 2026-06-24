"""add confidence score to answers

Revision ID: 004
Revises: 003
Create Date: 2026-06-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, Sequence[str], None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("answers", sa.Column("confidence", sa.Float(), nullable=True))

    # Earlier answers had the AI confidence score embedded in the comment text,
    # e.g. "... (confidence: 0.95)". Pull it out into the new column and strip it
    # from the comment so it isn't duplicated in the UI.
    op.execute(
        r"""
        UPDATE answers
        SET confidence = (regexp_match(comment, '\(confidence: ([0-9.]+)\)'))[1]::float
        WHERE comment ~ '\(confidence: [0-9.]+\)'
        """
    )
    op.execute(
        r"""
        UPDATE answers
        SET comment = trim(regexp_replace(comment, '\s*\(confidence: [0-9.]+\)', '', 'g'))
        WHERE comment ~ '\(confidence: [0-9.]+\)'
        """
    )


def downgrade() -> None:
    op.drop_column("answers", "confidence")
