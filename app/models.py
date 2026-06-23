from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    UNABLE_TO_DETERMINE = "unable_to_determine"


class AuditQuestion(BaseModel):
    question: str
    status: ComplianceStatus
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    observations: str = Field(description="What the AI observed in the video")


class HygieneAuditResult(BaseModel):
    id: str
    timestamp: datetime
    video_filename: str
    bare_below_elbows: AuditQuestion
    cuts_covered: AuditQuestion
    correct_technique: AuditQuestion
    paper_towel_disposal: AuditQuestion
    overall_compliant: bool
    summary: str


class AnalysisResponse(BaseModel):
    status: str = "success"
    result: HygieneAuditResult
