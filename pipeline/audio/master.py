from __future__ import annotations

import subprocess
from pathlib import Path

import numpy as np
import torchaudio as ta


def master_audio(raw_wav: Path, out_wav: Path) -> float:
    """Normalize loudness to -14 LUFS / -1 dBTP and resample to 48kHz mono PCM."""
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(raw_wav),
        "-af",
        "loudnorm=I=-14:TP=-1.0:LRA=7",
        "-ar",
        "48000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        str(out_wav),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    info = ta.info(str(out_wav))
    return info.num_frames / info.sample_rate


def compute_amplitude_envelope(wav_path: Path, fps: int = 60) -> list[float]:
    """Compute a normalized [0, 1] per-frame RMS amplitude envelope for Remotion visuals."""
    waveform, sr = ta.load(str(wav_path))
    samples = waveform.squeeze(0).numpy()
    hop = max(1, int(sr / fps))
    num_frames = int(np.ceil(len(samples) / hop))

    envelope: list[float] = []
    for i in range(num_frames):
        chunk = samples[i * hop : (i + 1) * hop]
        rms = float(np.sqrt(np.mean(chunk**2))) if len(chunk) > 0 else 0.0
        envelope.append(rms)

    peak = max(envelope) if envelope else 1.0
    if peak <= 1e-6:
        return [0.0 for _ in envelope]
    return [round(min(1.0, v / peak), 3) for v in envelope]
