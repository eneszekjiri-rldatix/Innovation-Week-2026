import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AnswerType(str, enum.Enum):
    COMPLIANCE = "COMPLIANCE"


class AnswerValue(str, enum.Enum):
    COMPLIANT = "COMPLIANT"
    NOT_COMPLIANT = "NOT_COMPLIANT"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class AuditStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class AuditReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"


class Standard(Base):
    __tablename__ = "standards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    questions: Mapped[list["Question"]] = relationship(back_populates="standard", cascade="all, delete-orphan")
    audits: Mapped[list["Audit"]] = relationship(back_populates="standard")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    standard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("standards.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    short_label: Mapped[str | None] = mapped_column(Text)
    answer_type: Mapped[AnswerType] = mapped_column(
        Enum(AnswerType, name="answer_type", create_constraint=True), nullable=False, default=AnswerType.COMPLIANCE
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    standard: Mapped["Standard"] = relationship(back_populates="questions")
    answers: Mapped[list["Answer"]] = relationship(back_populates="question")


class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    standard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("standards.id", ondelete="RESTRICT"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AuditStatus] = mapped_column(
        Enum(AuditStatus, name="audit_status", create_constraint=True), nullable=False, default=AuditStatus.DRAFT
    )
    unit: Mapped[str] = mapped_column(Text, nullable=False, default="")
    video_path: Mapped[str | None] = mapped_column(Text)
    review_status: Mapped[AuditReviewStatus] = mapped_column(
        Enum(AuditReviewStatus, name="audit_review_status", create_constraint=True),
        nullable=False,
        default=AuditReviewStatus.PENDING,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    standard: Mapped["Standard"] = relationship(back_populates="audits")
    answers: Mapped[list["Answer"]] = relationship(back_populates="audit", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    __table_args__ = (UniqueConstraint("audit_id", "question_id", name="uq_answers_audit_question"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("audits.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id", ondelete="RESTRICT"), nullable=False
    )
    value: Mapped[AnswerValue] = mapped_column(
        Enum(AnswerValue, name="answer_value", create_constraint=True), nullable=False
    )
    comment: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    audit: Mapped["Audit"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship(back_populates="answers")
