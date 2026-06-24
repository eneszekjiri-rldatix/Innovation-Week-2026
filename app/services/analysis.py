import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from langchain_core.messages import HumanMessage
from langchain_aws import ChatBedrock

from app.config import settings
from app.models import (
    AuditQuestion,
    ComplianceStatus,
    HygieneAuditResult,
)

logger = logging.getLogger(__name__)

AUDIT_PROMPT = """You are a hand hygiene compliance auditor. Analyze the following video frames 
from a hand washing procedure and evaluate compliance against these specific audit criteria:

1. **Bare Below the Elbows**: Staff must have no watches, bracelets, rings (except plain wedding band), 
   long sleeves, or any accessories below the elbow during hand washing.

2. **Cuts and Grazes Covered**: Any visible cuts or grazes on hands/arms must be covered with a 
   blue/waterproof plaster.

3. **Correct Hand Hygiene Technique**: The WHO/NHS hand washing technique must be followed:
   - Wet hands, apply soap
   - Palm to palm rubbing
   - Right palm over left dorsum and vice versa
   - Palm to palm with fingers interlaced
   - Backs of fingers to opposing palms
   - Rotational rubbing of thumbs
   - Rotational rubbing of clasped fingers in palms
   - Rinse and dry thoroughly
   - Duration should be approximately 20+ seconds

4. **Paper Towel Disposal**: Paper towels must be disposed of without touching the waste bin lid 
   (using a foot pedal or touchless bin).

For each criterion, provide:
- status: "compliant", "non_compliant", or "unable_to_determine"
- confidence: a score between 0.0 and 1.0
- observations: what you specifically observed in the video frames

Also provide:
- overall_compliant: true only if ALL criteria are compliant
- summary: a brief overall assessment

Respond ONLY with valid JSON in this exact format:
{
    "bare_below_elbows": {
        "status": "compliant|non_compliant|unable_to_determine",
        "confidence": 0.0,
        "observations": "..."
    },
    "cuts_covered": {
        "status": "compliant|non_compliant|unable_to_determine",
        "confidence": 0.0,
        "observations": "..."
    },
    "correct_technique": {
        "status": "compliant|non_compliant|unable_to_determine",
        "confidence": 0.0,
        "observations": "..."
    },
    "paper_towel_disposal": {
        "status": "compliant|non_compliant|unable_to_determine",
        "confidence": 0.0,
        "observations": "..."
    },
    "overall_compliant": false,
    "summary": "..."
}"""


def _build_message_content(frames_b64: list[str]) -> list[dict]:
    """Build a Bedrock/Anthropic multimodal message with text prompt and images."""
    content: list[dict] = [{"type": "text", "text": AUDIT_PROMPT}]

    for index, frame in enumerate(frames_b64, start=1):
        content.append({"type": "text", "text": f"Sampled video frame {index}:"})
        content.append(
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": frame,
                },
            }
        )

    return content


def _response_content_to_text(content: str | list[dict]) -> str:
    """Normalize LangChain response content into plain text."""
    if isinstance(content, str):
        return content

    text_parts = []
    for block in content:
        if block.get("type") == "text":
            text_parts.append(block.get("text", ""))

    return "\n".join(text_parts)


def _parse_response(raw_content: str | list[dict]) -> dict:
    """Extract JSON from the model response."""
    text = _response_content_to_text(raw_content).strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        text = text.rsplit("```", 1)[0]
    if "{" in text and "}" in text:
        text = text[text.find("{") : text.rfind("}") + 1]
    return json.loads(text)


def _aws_credentials_look_configured() -> bool:
    """Catch obvious placeholder credentials before calling Bedrock."""
    access_key = os.getenv("AWS_ACCESS_KEY_ID", "")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    return (
        bool(access_key)
        and bool(secret_key)
        and "INSERT" not in access_key.upper()
        and "INSERT" not in secret_key.upper()
    )


async def analyze_hand_hygiene(
    frames_b64: list[str], video_filename: str
) -> HygieneAuditResult:
    """
    Send extracted frames to Claude via Bedrock and parse the compliance result.
    Falls back to mock response when HYGIENE_USE_MOCK=true.
    """
    if settings.use_mock:
        logger.info("Using mock analysis (set HYGIENE_USE_MOCK=false to use Bedrock)")
        return _mock_result(video_filename, len(frames_b64))

    if not _aws_credentials_look_configured():
        raise RuntimeError(
            "Bedrock credentials are not configured. Replace the placeholder AWS keys "
            "in .env, then restart the API."
        )

    llm = ChatBedrock(
        model_id=settings.bedrock_model_id,
        region_name=settings.aws_region,
        model_kwargs={"temperature": 0},
    )

    message = HumanMessage(content=_build_message_content(frames_b64))
    response = await llm.ainvoke([message])

    parsed = _parse_response(response.content)

    def _make_question(key: str, question_text: str) -> AuditQuestion:
        data = parsed[key]
        return AuditQuestion(
            question=question_text,
            status=ComplianceStatus(data["status"]),
            confidence=data["confidence"],
            observations=data["observations"],
        )

    result = HygieneAuditResult(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc),
        video_filename=video_filename,
        bare_below_elbows=_make_question(
            "bare_below_elbows", "Staff are 'Bare Below the Elbows'"
        ),
        cuts_covered=_make_question(
            "cuts_covered",
            "Cuts and grazes are covered with a waterproof plaster",
        ),
        correct_technique=_make_question(
            "correct_technique",
            "The correct hand hygiene technique is used when washing hands",
        ),
        paper_towel_disposal=_make_question(
            "paper_towel_disposal",
            "Paper towels are disposed of without touching the waste bin lid",
        ),
        overall_compliant=parsed["overall_compliant"],
        summary=parsed["summary"],
    )

    return result


def _mock_result(video_filename: str, frame_count: int) -> HygieneAuditResult:
    """Return a mock audit result for testing without Bedrock access."""
    return HygieneAuditResult(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc),
        video_filename=video_filename,
        bare_below_elbows=AuditQuestion(
            question="Staff are 'Bare Below the Elbows'",
            status=ComplianceStatus.UNABLE_TO_DETERMINE,
            confidence=0.0,
            observations=f"[MOCK] Analyzed {frame_count} frames. Replace HYGIENE_USE_MOCK=false in .env to enable real analysis.",
        ),
        cuts_covered=AuditQuestion(
            question="Cuts and grazes are covered with a waterproof plaster",
            status=ComplianceStatus.UNABLE_TO_DETERMINE,
            confidence=0.0,
            observations=f"[MOCK] Analyzed {frame_count} frames. Awaiting Bedrock credentials.",
        ),
        correct_technique=AuditQuestion(
            question="The correct hand hygiene technique is used when washing hands",
            status=ComplianceStatus.UNABLE_TO_DETERMINE,
            confidence=0.0,
            observations=f"[MOCK] Analyzed {frame_count} frames. Awaiting Bedrock credentials.",
        ),
        paper_towel_disposal=AuditQuestion(
            question="Paper towels are disposed of without touching the waste bin lid",
            status=ComplianceStatus.UNABLE_TO_DETERMINE,
            confidence=0.0,
            observations=f"[MOCK] Analyzed {frame_count} frames. Awaiting Bedrock credentials.",
        ),
        overall_compliant=False,
        summary=f"[MOCK RESPONSE] Video '{video_filename}' uploaded successfully and {frame_count} frames extracted. Set HYGIENE_USE_MOCK=false in .env once you have AWS Bedrock access to enable real AI analysis.",
    )


def save_result(result: HygieneAuditResult) -> Path:
    """Save the audit result as a JSON file."""
    output_path = settings.results_dir / f"{result.id}.json"
    output_path.write_text(result.model_dump_json(indent=2))
    return output_path
