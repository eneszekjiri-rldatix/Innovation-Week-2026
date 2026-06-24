import re
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO

from app.config import settings


def _safe_filename(filename: str) -> str:
    path = Path(filename)
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", path.stem).strip("._")
    suffix = re.sub(r"[^A-Za-z0-9.]+", "", path.suffix.lower())

    if not stem:
        stem = "uploaded_video"

    return f"{stem}{suffix}"


def save_uploaded_video(file: BinaryIO, original_filename: str) -> Path:
    """
    Save the uploaded video to the local Desktop archive folder.

    The unique prefix avoids overwriting videos that share the same original filename.
    """
    settings.saved_videos_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    archive_name = f"{timestamp}_{uuid.uuid4().hex}_{_safe_filename(original_filename)}"
    archive_path = settings.saved_videos_dir / archive_name

    with archive_path.open("wb") as output:
        shutil.copyfileobj(file, output)

    return archive_path
