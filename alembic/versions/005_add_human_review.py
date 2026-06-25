"""add human review tracking to audits and answers

Revision ID: 005
Revises: 004
Create Date: 2026-06-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: Union[str, Sequence[str], None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

audit_review_status = postgresql.ENUM(
    "PENDING", "APPROVED", "REJECTED", name="audit_review_status", create_type=False
)


def upgrade() -> None:
    op.execute("CREATE TYPE audit_review_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED')")
    op.add_column(
        "audits",
        sa.Column("review_status", audit_review_status, server_default="PENDING", nullable=False),
    )
    op.add_column("audits", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "answers",
        sa.Column("human_reviewed", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("answers", "human_reviewed")
    op.drop_column("audits", "reviewed_at")
    op.drop_column("audits", "review_status")
    op.execute("DROP TYPE audit_review_status")
