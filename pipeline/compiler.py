from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

from pipeline.audio.aligner import WordTiming
from pipeline.audio.master import compute_amplitude_envelope
from pipeline.config import ROOT_DIR, ShortJob, ViralScript, get_job_dir


def compile_render_props(
    job: ShortJob,
    script: ViralScript,
    words: list[WordTiming],
    audio_path: Path,
    duration_sec: float,
    fps: int = 60,
) -> Path:
    job_dir = get_job_dir(job.id)
    public_audio_dir = ROOT_DIR / "renderer" / "public" / "jobs" / job.id
    public_audio_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(audio_path, public_audio_dir / "audio.wav")

    duration_in_frames = max(fps, math.ceil((duration_sec + 0.35) * fps))
    envelope = compute_amplitude_envelope(audio_path, fps=fps)

    word_frames = [
        {
            "text": w.text,
            "startFrame": int(round(w.start * fps)),
            "endFrame": max(int(round(w.start * fps)) + 2, int(round(w.end * fps))),
            "isEmphasis": w.is_emphasis,
        }
        for w in words
    ]

    scenes = []
    cursor = 0
    segments = [(script.hook, script.hook_visual)] + [(b.text, b.visual) for b in script.beats]
    for seg_idx, (seg_text, vis) in enumerate(segments):
        count = len(seg_text.split())
        seg_words = word_frames[cursor : cursor + count]
        cursor += count
        if not seg_words:
            continue
        start_f = 0 if seg_idx == 0 else seg_words[0]["startFrame"]
        end_f = duration_in_frames if seg_idx == len(segments) - 1 else seg_words[-1]["endFrame"]
        scenes.append(
            {
                "startFrame": start_f,
                "endFrame": max(start_f + 1, end_f),
                "headline": vis.headline or script.title,
                "sublabel": vis.sublabel or script.era_label,
                "metricValue": vis.metric_value,
                "cameraMotion": vis.camera_motion,
                "backdrop": vis.backdrop,
                "landmark": vis.landmark,
                "landmarkState": vis.landmark_state,
                "actors": [a.model_dump() for a in vis.actors],
                "props": list(vis.props),
                "fx": list(vis.fx),
            }
        )

    props = {
        "jobId": job.id,
        "locale": job.locale,
        "theme": job.theme or "editorial_dark",
        "fps": fps,
        "durationInFrames": duration_in_frames,
        "audioSrc": f"jobs/{job.id}/audio.wav",
        "title": script.title,
        "eraLabel": script.era_label,
        "year": script.year,
        "citations": [c.model_dump() for c in script.citations],
        "words": word_frames,
        "scenes": scenes,
        "amplitudeEnvelope": envelope,
    }

    props_path = job_dir / "props.json"
    props_path.write_text(json.dumps(props, ensure_ascii=False, indent=2), encoding="utf-8")
    return props_path
