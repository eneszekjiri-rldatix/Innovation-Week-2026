from dataclasses import dataclass


@dataclass(frozen=True)
class FrameSample:
    timestamp_seconds: float


def one_frame_per_second_timestamps(
    duration_seconds: float,
    max_frames: int,
) -> list[FrameSample]:
    """
    Select one frame at every whole second of the video timeline.

    Example: a 5.7 second video produces samples at 0s, 1s, 2s, 3s, 4s, 5s.
    """
    if duration_seconds <= 0:
        return []

    samples: list[FrameSample] = []
    current_second = 0

    while current_second <= duration_seconds and len(samples) < max_frames:
        samples.append(FrameSample(timestamp_seconds=float(current_second)))
        current_second += 1

    return samples
