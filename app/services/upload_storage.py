import logging
import re
import shutil
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO

import imageio_ffmpeg

from app.config import settings

logger = logging.getLogger(__name__)


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


def ensure_browser_playable(video_path: Path) -> Path:
    """
    Re-encode to H.264/MP4 if needed so the file plays in a <video> tag.

    Many CCTV/DVR exports use old MPEG-4 Part 2 ("mp4v") streams that OpenCV can
    decode for analysis but that no modern browser can play natively. Transcoding
    always (rather than probing the codec first) keeps this simple and cheap relative
    to the upload itself.
    """
    web_path = video_path.with_name(f"{video_path.stem}_web.mp4")
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    try:
        subprocess.run(
            [
                ffmpeg_exe,
                "-y",
                "-i", str(video_path),
                "-an",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                str(web_path),
            ],
            check=True,
            capture_output=True,
        )
        return web_path
    except (subprocess.CalledProcessError, OSError):
        logger.exception("Failed to transcode %s for browser playback; serving original file", video_path)
        return video_path
