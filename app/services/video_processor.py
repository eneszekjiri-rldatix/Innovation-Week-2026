import cv2
import base64
from pathlib import Path

from app.config import settings
from app.services.frame_sampling import one_frame_per_second_timestamps


def extract_frames(video_path: Path) -> list[str]:
    """
    Extract frames from a video at regular intervals.
    Returns a list of base64-encoded JPEG images.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps <= 0 or total_frames <= 0:
        cap.release()
        raise ValueError("Could not read video duration or frame rate")

    duration_seconds = total_frames / fps
    samples = one_frame_per_second_timestamps(duration_seconds, settings.max_frames)
    frames_b64: list[str] = []

    for sample in samples:
        cap.set(cv2.CAP_PROP_POS_MSEC, sample.timestamp_seconds * 1000)
        ret, frame = cap.read()
        if not ret:
            continue

        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        frames_b64.append(base64.b64encode(buffer).decode("utf-8"))

    cap.release()

    if not frames_b64:
        raise ValueError("No frames could be extracted from the video")

    return frames_b64
