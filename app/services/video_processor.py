import cv2
import base64
import tempfile
from pathlib import Path

from app.config import settings


def extract_frames(video_path: Path) -> list[str]:
    """
    Extract frames from a video at regular intervals.
    Returns a list of base64-encoded JPEG images.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_interval = int(fps * settings.frame_interval_seconds)

    if frame_interval < 1:
        frame_interval = 1

    frames_b64: list[str] = []
    frame_idx = 0

    while cap.isOpened() and len(frames_b64) < settings.max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_interval == 0:
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frames_b64.append(base64.b64encode(buffer).decode("utf-8"))

        frame_idx += 1

    cap.release()

    if not frames_b64:
        raise ValueError("No frames could be extracted from the video")

    return frames_b64
