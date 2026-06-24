"""add unit/video_path to audits and short_label to questions

Revision ID: 003
Revises: 002
Create Date: 2026-06-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, Sequence[str], None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

Q_BARE_BELOW_ELBOWS = "a0000000-0000-4000-8000-000000000011"
Q_CUTS_COVERED = "a0000000-0000-4000-8000-000000000012"
Q_CORRECT_TECHNIQUE = "a0000000-0000-4000-8000-000000000013"
Q_PAPER_TOWEL = "a0000000-0000-4000-8000-000000000014"

SHORT_LABELS = {
    Q_BARE_BELOW_ELBOWS: "Bare Below the Elbows",
    Q_CUTS_COVERED: "Cuts & Grazes Covered",
    Q_CORRECT_TECHNIQUE: "Hand Hygiene Technique",
    Q_PAPER_TOWEL: "Paper Towel Disposal",
}


def upgrade() -> None:
    op.add_column("audits", sa.Column("unit", sa.Text(), server_default="", nullable=False))
    op.add_column("audits", sa.Column("video_path", sa.Text(), nullable=True))
    op.add_column("questions", sa.Column("short_label", sa.Text(), nullable=True))
    op.create_index("ix_audits_unit", "audits", ["unit"])

    for question_id, label in SHORT_LABELS.items():
        escaped = label.replace("'", "''")
        op.execute(
            f"UPDATE questions SET short_label = '{escaped}' WHERE id = '{question_id}'"
        )


def downgrade() -> None:
    op.drop_index("ix_audits_unit", table_name="audits")
    op.drop_column("questions", "short_label")
    op.drop_column("audits", "video_path")
    op.drop_column("audits", "unit")
