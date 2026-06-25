import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.db.models import Answer, Audit, AnswerValue, AuditReviewStatus, Question, Standard
from app.db.session import SessionLocal

router = APIRouter()


class QuestionAnswer(BaseModel):
    question_id: str
    short_label: str | None
    text: str
    sort_order: int
    value: str | None
    comment: str | None
    confidence: float | None
    human_reviewed: bool


class AuditSummary(BaseModel):
    id: str
    unit: str
    standard_name: str
    created_at: datetime
    overall_compliant: bool
    failed_questions: list[str]
    has_video: bool
    review_status: str
    reviewed_at: datetime | None
    edited: bool
    questions: list[QuestionAnswer]


class AuditDetail(BaseModel):
    id: str
    unit: str
    standard_name: str
    status: str
    created_at: datetime
    completed_at: datetime | None
    has_video: bool
    review_status: str
    reviewed_at: datetime | None
    edited: bool
    questions: list[QuestionAnswer]


class AuditReviewRequest(BaseModel):
    status: AuditReviewStatus


class AnswerUpdateItem(BaseModel):
    question_id: str
    value: AnswerValue
    comment: str | None = None


class AuditUpdateRequest(BaseModel):
    answers: list[AnswerUpdateItem]


class TrendPoint(BaseModel):
    date: str
    percent_compliant: float


class TrendSeries(BaseModel):
    question_id: str
    short_label: str | None
    points: list[TrendPoint]


class TrendResponse(BaseModel):
    unit: str
    series: list[TrendSeries]


def _parse_uuid(audit_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(audit_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Audit not found")


def _build_questions(audit: Audit) -> list[QuestionAnswer]:
    answers_by_question = {answer.question_id: answer for answer in audit.answers}
    questions = sorted(audit.standard.questions, key=lambda q: q.sort_order)

    return [
        QuestionAnswer(
            question_id=str(question.id),
            short_label=question.short_label,
            text=question.text,
            sort_order=question.sort_order,
            value=answers_by_question[question.id].value.value if question.id in answers_by_question else None,
            comment=answers_by_question[question.id].comment if question.id in answers_by_question else None,
            confidence=answers_by_question[question.id].confidence if question.id in answers_by_question else None,
            human_reviewed=(
                answers_by_question[question.id].human_reviewed if question.id in answers_by_question else False
            ),
        )
        for question in questions
    ]


def _build_detail(audit: Audit) -> AuditDetail:
    return AuditDetail(
        id=str(audit.id),
        unit=audit.unit,
        standard_name=audit.standard.name,
        status=audit.status.value,
        created_at=audit.created_at,
        completed_at=audit.completed_at,
        has_video=bool(audit.video_path),
        review_status=audit.review_status.value,
        reviewed_at=audit.reviewed_at,
        edited=any(answer.human_reviewed for answer in audit.answers),
        questions=_build_questions(audit),
    )


@router.get("/audits", response_model=list[AuditSummary])
def list_audits():
    with SessionLocal() as db:
        audits = (
            db.execute(
                select(Audit)
                .options(
                    joinedload(Audit.standard).joinedload(Standard.questions),
                    joinedload(Audit.answers).joinedload(Answer.question),
                )
                .order_by(Audit.created_at.desc())
            )
            .unique()
            .scalars()
            .all()
        )

        summaries = []
        for audit in audits:
            failed = [
                (answer.question.short_label or answer.question.text)
                for answer in audit.answers
                if answer.value == AnswerValue.NOT_COMPLIANT
            ]
            summaries.append(
                AuditSummary(
                    id=str(audit.id),
                    unit=audit.unit,
                    standard_name=audit.standard.name,
                    created_at=audit.created_at,
                    overall_compliant=not failed,
                    failed_questions=failed,
                    has_video=bool(audit.video_path),
                    review_status=audit.review_status.value,
                    reviewed_at=audit.reviewed_at,
                    edited=any(answer.human_reviewed for answer in audit.answers),
                    questions=_build_questions(audit),
                )
            )
        return summaries


@router.get("/audits/{audit_id}", response_model=AuditDetail)
def get_audit(audit_id: str):
    with SessionLocal() as db:
        audit = db.get(
            Audit,
            _parse_uuid(audit_id),
            options=[
                joinedload(Audit.standard).joinedload(Standard.questions),
                joinedload(Audit.answers),
            ],
        )
        if audit is None:
            raise HTTPException(status_code=404, detail="Audit not found")
        return _build_detail(audit)


@router.put("/audits/{audit_id}", response_model=AuditDetail)
def update_audit(audit_id: str, payload: AuditUpdateRequest):
    with SessionLocal() as db:
        audit = db.get(
            Audit,
            _parse_uuid(audit_id),
            options=[
                joinedload(Audit.standard).joinedload(Standard.questions),
                joinedload(Audit.answers),
            ],
        )
        if audit is None:
            raise HTTPException(status_code=404, detail="Audit not found")

        answers_by_question = {answer.question_id: answer for answer in audit.answers}
        for item in payload.answers:
            answer = answers_by_question.get(_parse_uuid(item.question_id))
            if answer is None:
                raise HTTPException(
                    status_code=400, detail=f"No existing answer for question {item.question_id} on this audit"
                )
            if answer.value != item.value or answer.comment != item.comment:
                answer.value = item.value
                answer.comment = item.comment
                answer.human_reviewed = True

        db.commit()
        db.refresh(audit)
        return _build_detail(audit)


@router.put("/audits/{audit_id}/review", response_model=AuditDetail)
def review_audit(audit_id: str, payload: AuditReviewRequest):
    with SessionLocal() as db:
        audit = db.get(
            Audit,
            _parse_uuid(audit_id),
            options=[
                joinedload(Audit.standard).joinedload(Standard.questions),
                joinedload(Audit.answers),
            ],
        )
        if audit is None:
            raise HTTPException(status_code=404, detail="Audit not found")

        audit.review_status = payload.status
        audit.reviewed_at = (
            None if payload.status == AuditReviewStatus.PENDING else datetime.now(timezone.utc)
        )

        db.commit()
        db.refresh(audit)
        return _build_detail(audit)


@router.get("/audits/{audit_id}/video")
def get_audit_video(audit_id: str):
    with SessionLocal() as db:
        audit = db.get(Audit, _parse_uuid(audit_id))
        if audit is None:
            raise HTTPException(status_code=404, detail="Audit not found")
        if not audit.video_path:
            raise HTTPException(status_code=404, detail="No video stored for this audit")
        return FileResponse(audit.video_path)


@router.get("/trend", response_model=TrendResponse)
def get_trend(unit: str = "All Units", days: int = 30):
    with SessionLocal() as db:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        query = (
            select(Answer, Audit)
            .join(Audit, Answer.audit_id == Audit.id)
            .where(Audit.created_at >= since)
            .where(Answer.value != AnswerValue.NOT_APPLICABLE)
        )
        if unit != "All Units":
            query = query.where(Audit.unit == unit)

        rows = db.execute(query).all()

        questions = {q.id: q for q in db.execute(select(Question)).scalars().all()}

        counts: dict[tuple, list[int, int]] = defaultdict(lambda: [0, 0])
        for answer, audit in rows:
            day_key = audit.created_at.date().isoformat()
            key = (answer.question_id, day_key)
            counts[key][1] += 1
            if answer.value == AnswerValue.COMPLIANT:
                counts[key][0] += 1

        by_question: dict = defaultdict(list)
        for (question_id, day_key), (compliant, total) in counts.items():
            by_question[question_id].append(
                TrendPoint(date=day_key, percent_compliant=round(compliant / total * 100, 1))
            )

        series = [
            TrendSeries(
                question_id=str(question_id),
                short_label=questions[question_id].short_label if question_id in questions else None,
                points=sorted(points, key=lambda p: p.date),
            )
            for question_id, points in by_question.items()
        ]

        return TrendResponse(unit=unit, series=series)
