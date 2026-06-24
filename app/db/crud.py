from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import Answer, Audit, AuditStatus, AnswerValue, Question, Standard
from app.models import ComplianceStatus, HygieneAuditResult

STANDARD_NAME = "Hand Hygiene Compliance"

_STATUS_TO_ANSWER_VALUE = {
    ComplianceStatus.COMPLIANT: AnswerValue.COMPLIANT,
    ComplianceStatus.NON_COMPLIANT: AnswerValue.NOT_COMPLIANT,
    ComplianceStatus.UNABLE_TO_DETERMINE: AnswerValue.NOT_APPLICABLE,
}

_RESULT_FIELDS_IN_QUESTION_ORDER = [
    "bare_below_elbows",
    "cuts_covered",
    "correct_technique",
    "paper_towel_disposal",
]


def persist_audit_result(
    db: Session, result: HygieneAuditResult, unit: str = "", video_path: str | None = None
) -> Audit:
    """Persist a HygieneAuditResult as an Audit row with one Answer per criterion."""
    standard = db.query(Standard).filter_by(name=STANDARD_NAME).first()
    if standard is None:
        raise ValueError(f"Standard '{STANDARD_NAME}' not found; run migrations first.")

    questions = (
        db.query(Question)
        .filter_by(standard_id=standard.id)
        .order_by(Question.sort_order)
        .all()
    )
    if len(questions) != len(_RESULT_FIELDS_IN_QUESTION_ORDER):
        raise ValueError(
            f"Expected {len(_RESULT_FIELDS_IN_QUESTION_ORDER)} questions for "
            f"'{STANDARD_NAME}', found {len(questions)}."
        )

    audit = Audit(
        standard_id=standard.id,
        title=result.video_filename,
        status=AuditStatus.COMPLETED,
        created_at=result.timestamp,
        completed_at=datetime.now(timezone.utc),
        unit=unit,
        video_path=video_path,
    )
    db.add(audit)

    for question, field_name in zip(questions, _RESULT_FIELDS_IN_QUESTION_ORDER):
        audit_question = getattr(result, field_name)
        db.add(
            Answer(
                audit=audit,
                question_id=question.id,
                value=_STATUS_TO_ANSWER_VALUE[audit_question.status],
                comment=audit_question.observations,
                confidence=audit_question.confidence,
            )
        )

    db.commit()
    db.refresh(audit)
    return audit
