import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from app.config import settings
from app.models import AnalysisResponse, HygieneAuditResult
from app.services.video_processor import extract_frames
from app.services.analysis import analyze_hand_hygiene, save_result

app = FastAPI(
    title="Hand Hygiene Audit API",
    description="AI-powered hand hygiene compliance checker using video analysis",
    version="1.0.0",
)


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_video(video: UploadFile):
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

    video_id = str(uuid.uuid4())
    video_path = settings.upload_dir / f"{video_id}{file_ext}"

    try:
        with open(video_path, "wb") as f:
            shutil.copyfileobj(video.file, f)

        frames = extract_frames(video_path)

        result = await analyze_hand_hygiene(frames, video.filename)

        save_result(result)

        return AnalysisResponse(status="success", result=result)

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if video_path.exists():
            video_path.unlink()


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
