"""seed hand hygiene standard

Revision ID: 002
Revises: 001
Create Date: 2026-06-24

"""

from typing import Sequence, Union

from alembic import op

revision: str = "002"
down_revision: Union[str, Sequence[str], None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STANDARD_ID = "a0000000-0000-4000-8000-000000000001"
Q_BARE_BELOW_ELBOWS = "a0000000-0000-4000-8000-000000000011"
Q_CUTS_COVERED = "a0000000-0000-4000-8000-000000000012"
Q_CORRECT_TECHNIQUE = "a0000000-0000-4000-8000-000000000013"
Q_PAPER_TOWEL = "a0000000-0000-4000-8000-000000000014"
AUDIT_ID = "a0000000-0000-4000-8000-000000000021"


def upgrade() -> None:
    op.execute(
        f"""
        INSERT INTO standards (id, name, description)
        VALUES (
            '{STANDARD_ID}',
            'Hand Hygiene Compliance',
            'NHS/WHO hand hygiene audit criteria for video and live inspections'
        )
        """
    )

    questions = [
        (
            Q_BARE_BELOW_ELBOWS,
            1,
            "Staff must have no watches, bracelets, rings (except plain wedding band), long sleeves, or any accessories below the elbow during hand washing.",
        ),
        (
            Q_CUTS_COVERED,
            2,
            "Any visible cuts or grazes on hands/arms must be covered with a blue/waterproof plaster.",
        ),
        (
            Q_CORRECT_TECHNIQUE,
            3,
            "The WHO/NHS hand washing technique must be followed (wet hands, apply soap, palm-to-palm rubbing, dorsum rubbing, interlaced fingers, backs of fingers, thumb rotation, clasped-finger rotation, rinse and dry thoroughly; duration ~20+ seconds).",
        ),
        (
            Q_PAPER_TOWEL,
            4,
            "Paper towels must be disposed of without touching the waste bin lid (foot pedal or touchless bin).",
        ),
    ]

    for question_id, sort_order, text in questions:
        escaped = text.replace("'", "''")
        op.execute(
            f"""
            INSERT INTO questions (id, standard_id, text, answer_type, sort_order, is_required)
            VALUES ('{question_id}', '{STANDARD_ID}', '{escaped}', 'COMPLIANCE', {sort_order}, true)
            """
        )

    op.execute(
        f"""
        INSERT INTO audits (id, standard_id, title, status, completed_at)
        VALUES (
            '{AUDIT_ID}',
            '{STANDARD_ID}',
            'Kitchen hand hygiene – 2026-06-24',
            'COMPLETED',
            now()
        )
        """
    )

    answers = [
        (Q_BARE_BELOW_ELBOWS, "COMPLIANT", "No accessories visible below the elbow"),
        (Q_CUTS_COVERED, "NOT_APPLICABLE", "No visible cuts or grazes"),
        (Q_CORRECT_TECHNIQUE, "NOT_COMPLIANT", "Scrubbing duration ~12 seconds; technique steps otherwise observed"),
        (Q_PAPER_TOWEL, "COMPLIANT", "Foot-pedal bin used, no lid contact"),
    ]

    for question_id, value, comment in answers:
        escaped = comment.replace("'", "''")
        op.execute(
            f"""
            INSERT INTO answers (audit_id, question_id, value, comment)
            VALUES ('{AUDIT_ID}', '{question_id}', '{value}', '{escaped}')
            """
        )


def downgrade() -> None:
    op.execute(f"DELETE FROM answers WHERE audit_id = '{AUDIT_ID}'")
    op.execute(f"DELETE FROM audits WHERE id = '{AUDIT_ID}'")
    op.execute(f"DELETE FROM questions WHERE standard_id = '{STANDARD_ID}'")
    op.execute(f"DELETE FROM standards WHERE id = '{STANDARD_ID}'")
