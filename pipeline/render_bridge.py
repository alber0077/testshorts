from __future__ import annotations

import json
import subprocess
from pathlib import Path

from pipeline.config import ROOT_DIR, get_job_dir


def render_video(job_id: str, max_duration_sec: float = 59.5) -> Path:
    job_dir = get_job_dir(job_id)
    props_path = job_dir / "props.json"
    out_mp4 = job_dir / "final.mp4"
    renderer_dir = ROOT_DIR / "renderer"

    props = json.loads(props_path.read_text(encoding="utf-8"))
    duration_sec = props["durationInFrames"] / props["fps"]
    if duration_sec > max_duration_sec:
        raise RuntimeError(
            f"Job '{job_id}' duration {duration_sec:.2f}s exceeds Shorts limit ({max_duration_sec}s)."
        )

    cmd = [
        "npx",
        "remotion",
        "render",
        "src/index.ts",
        "HistoryShort",
        str(out_mp4),
        f"--props={props_path}",
        "--codec=h264",
        "--pixel-format=yuv420p",
        "--crf=17",
        "--audio-codec=aac",
        "--audio-bitrate=192k",
    ]
    subprocess.run(cmd, cwd=str(renderer_dir), check=True)

    if not out_mp4.exists() or out_mp4.stat().st_size == 0:
        raise RuntimeError(f"Remotion produced empty output for '{job_id}'.")
    return out_mp4
