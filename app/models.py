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


class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    input_cost_per_1k_usd: float = 0.0
    output_cost_per_1k_usd: float = 0.0
    estimated_cost_usd: float = Field(
        default=0.0,
        description="Estimated Bedrock cost in USD based on configured token pricing",
    )


class HygieneAuditResult(BaseModel):
    id: str
    timestamp: datetime
    video_filename: str
    ai_agent: str = Field(
        default="unknown",
        description="The AI model or agent used to produce the audit result",
    )
    usage: TokenUsage | None = None
    bare_below_elbows: AuditQuestion
    cuts_covered: AuditQuestion
    correct_technique: AuditQuestion
    paper_towel_disposal: AuditQuestion
    overall_compliant: bool
    summary: str


class AnalysisResponse(BaseModel):
    status: str = "success"
    result: HygieneAuditResult
