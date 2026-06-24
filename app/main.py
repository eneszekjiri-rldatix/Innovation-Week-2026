from pathlib import Path

from fastapi import FastAPI, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.crud import persist_audit_result
from app.db.session import SessionLocal
from app.models import AnalysisResponse, HygieneAuditResult
from app.routers.audits import router as audits_router
from app.services.video_processor import extract_frames
from app.services.analysis import analyze_hand_hygiene, save_result
from app.services.upload_storage import ensure_browser_playable, save_uploaded_video

app = FastAPI(
    title="Hand Hygiene Audit API",
    description="AI-powered hand hygiene compliance checker using video analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audits_router)


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_video(video: UploadFile, unit: str = Form(default="")):
    """
    Upload a video of a hand washing procedure and receive a compliance audit result.

    Supported formats: mp4, avi, mov, mkv
    """
    allowed_extensions = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
    file_ext = Path(video.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Allowed: {', '.join(allowed_extensions)}",
        )

    try:
        saved_video_path = save_uploaded_video(video.file, video.filename)

        frames = extract_frames(saved_video_path)

        result = await analyze_hand_hygiene(frames, video.filename)

        playable_video_path = ensure_browser_playable(saved_video_path)

        save_result(result)
        with SessionLocal() as db:
            audit = persist_audit_result(db, result, unit=unit, video_path=str(playable_video_path))
            audit_id = str(audit.id)

        return AnalysisResponse(status="success", result=result, audit_id=audit_id)

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/results", response_model=list[HygieneAuditResult])
async def list_results():
    """List all previous audit results."""
    results = []
    for result_file in sorted(settings.results_dir.glob("*.json"), reverse=True):
        results.append(HygieneAuditResult.model_validate_json(result_file.read_text()))
    return results


@app.get("/results/{result_id}", response_model=HygieneAuditResult)
async def get_result(result_id: str):
    """Get a specific audit result by ID."""
    result_path = settings.results_dir / f"{result_id}.json"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Result not found")
    return HygieneAuditResult.model_validate_json(result_path.read_text())


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
