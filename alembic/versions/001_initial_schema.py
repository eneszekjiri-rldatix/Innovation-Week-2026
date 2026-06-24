"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

answer_type = postgresql.ENUM("COMPLIANCE", name="answer_type", create_type=False)
answer_value = postgresql.ENUM("COMPLIANT", "NOT_COMPLIANT", "NOT_APPLICABLE", name="answer_value", create_type=False)
audit_status = postgresql.ENUM("DRAFT", "IN_PROGRESS", "COMPLETED", name="audit_status", create_type=False)


def upgrade() -> None:
    op.execute("CREATE TYPE answer_type AS ENUM ('COMPLIANCE')")
    op.execute("CREATE TYPE answer_value AS ENUM ('COMPLIANT', 'NOT_COMPLIANT', 'NOT_APPLICABLE')")
    op.execute("CREATE TYPE audit_status AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED')")

    op.create_table(
        "standards",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "questions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("standard_id", sa.UUID(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("answer_type", answer_type, server_default="COMPLIANCE", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_required", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["standard_id"], ["standards.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "audits",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("standard_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("status", audit_status, server_default="DRAFT", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["standard_id"], ["standards.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "answers",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("audit_id", sa.UUID(), nullable=False),
        sa.Column("question_id", sa.UUID(), nullable=False),
        sa.Column("value", answer_value, nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["audit_id"], ["audits.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("audit_id", "question_id", name="uq_answers_audit_question"),
    )

    op.create_index("ix_questions_standard_id", "questions", ["standard_id"])
    op.create_index("ix_questions_standard_sort", "questions", ["standard_id", "sort_order"])
    op.create_index("ix_audits_standard_id", "audits", ["standard_id"])
    op.create_index("ix_audits_status", "audits", ["status"])
    op.create_index("ix_answers_audit_id", "answers", ["audit_id"])
    op.create_index("ix_answers_question_id", "answers", ["question_id"])
    op.create_index("ix_answers_value", "answers", ["value"])


def downgrade() -> None:
    op.drop_index("ix_answers_value", table_name="answers")
    op.drop_index("ix_answers_question_id", table_name="answers")
    op.drop_index("ix_answers_audit_id", table_name="answers")
    op.drop_index("ix_audits_status", table_name="audits")
    op.drop_index("ix_audits_standard_id", table_name="audits")
    op.drop_index("ix_questions_standard_sort", table_name="questions")
    op.drop_index("ix_questions_standard_id", table_name="questions")
    op.drop_table("answers")
    op.drop_table("audits")
    op.drop_table("questions")
    op.drop_table("standards")
    op.execute("DROP TYPE audit_status")
    op.execute("DROP TYPE answer_value")
    op.execute("DROP TYPE answer_type")
