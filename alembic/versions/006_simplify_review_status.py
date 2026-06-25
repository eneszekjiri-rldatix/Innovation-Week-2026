"""simplify audit review status to pending/reviewed and drop human_reviewed

Revision ID: 006
Revises: 005
Create Date: 2026-06-25

"""

from typing import Sequence, Union

from alembic import op

revision: str = "006"
down_revision: Union[str, Sequence[str], None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE audit_review_status RENAME TO audit_review_status_old")
    op.execute("CREATE TYPE audit_review_status AS ENUM ('PENDING', 'REVIEWED')")
    op.execute("ALTER TABLE audits ALTER COLUMN review_status DROP DEFAULT")
    op.execute(
        """
        ALTER TABLE audits
        ALTER COLUMN review_status TYPE audit_review_status
        USING (
            CASE review_status::text
                WHEN 'APPROVED' THEN 'REVIEWED'
                ELSE 'PENDING'
            END
        )::audit_review_status
        """
    )
    op.execute("ALTER TABLE audits ALTER COLUMN review_status SET DEFAULT 'PENDING'")
    op.execute("DROP TYPE audit_review_status_old")

    op.drop_column("answers", "human_reviewed")


def downgrade() -> None:
    import sqlalchemy as sa

    op.add_column(
        "answers",
        sa.Column("human_reviewed", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )

    op.execute("ALTER TYPE audit_review_status RENAME TO audit_review_status_old")
    op.execute("CREATE TYPE audit_review_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED')")
    op.execute("ALTER TABLE audits ALTER COLUMN review_status DROP DEFAULT")
    op.execute(
        """
        ALTER TABLE audits
        ALTER COLUMN review_status TYPE audit_review_status
        USING (
            CASE review_status::text
                WHEN 'REVIEWED' THEN 'APPROVED'
                ELSE 'PENDING'
            END
        )::audit_review_status
        """
    )
    op.execute("ALTER TABLE audits ALTER COLUMN review_status SET DEFAULT 'PENDING'")
    op.execute("DROP TYPE audit_review_status_old")
