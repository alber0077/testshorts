from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torchaudio as ta

from pipeline.config import LocaleConfig, ShortJob, ViralScript, VoiceProfile, get_job_dir

_ROMAN_ES: dict[str, str] = {
    "I": "primero",
    "II": "segundo",
    "III": "tercero",
    "IV": "cuarto",
    "V": "quinto",
    "VI": "sexto",
    "VII": "séptimo",
    "VIII": "octavo",
    "IX": "noveno",
    "X": "décimo",
    "XI": "once",
    "XII": "doce",
    "XIII": "trece",
    "XIV": "catorce",
    "XV": "quince",
    "XVI": "dieciséis",
    "XVII": "diecisiete",
    "XVIII": "dieciocho",
    "XIX": "diecinueve",
    "XX": "veinte",
    "XXI": "veintiuno",
}

_ROMAN_EN: dict[str, str] = {
    "I": "the first",
    "II": "the second",
    "III": "the third",
    "IV": "the fourth",
    "V": "the fifth",
    "VI": "the sixth",
    "VII": "the seventh",
    "VIII": "the eighth",
    "IX": "the ninth",
    "X": "the tenth",
    "XI": "the eleventh",
    "XII": "the twelfth",
    "XIII": "the thirteenth",
    "XIV": "the fourteenth",
    "XV": "the fifteenth",
    "XVI": "the sixteenth",
    "XVII": "the seventeenth",
    "XVIII": "the eighteenth",
    "XIX": "the nineteenth",
    "XX": "the twentieth",
    "XXI": "the twenty-first",
}


def _normalize_roman_numerals_for_tts(text: str, lang: str) -> str:
    table = _ROMAN_ES if lang == "es" else _ROMAN_EN if lang == "en" else {}
    if not table:
        return text

    def _replace(match: re.Match[str]) -> str:
        roman = match.group(1)
        return table.get(roman, roman)

    return re.sub(r"\b(XXI|XX|XIX|XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b", _replace, text)


def _split_sentences(text: str, max_chars: int = 220) -> list[str]:
    text = text.strip()
    if len(text) <= max_chars:
        return [text]
    parts = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    current = ""
    for part in parts:
        if not part:
            continue
        if len(current) + len(part) + 1 <= max_chars:
            current = f"{current} {part}".strip()
        else:
            if current:
                chunks.append(current)
            current = part
    if current:
        chunks.append(current)
    return chunks


def _set_seed(seed: int) -> None:
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def _stitch_segments(segments: list[tuple[torch.Tensor, int]], sr: int) -> torch.Tensor:
    fade_samples = int(sr * 0.012)
    pieces: list[torch.Tensor] = []

    for wav, pause_ms in segments:
        if wav.dim() == 2:
            wav = wav.squeeze(0)
        wav = wav.detach().cpu().float()
        if wav.numel() > 2 * fade_samples:
            fade_in = torch.linspace(0.0, 1.0, fade_samples)
            fade_out = torch.linspace(1.0, 0.0, fade_samples)
            wav[:fade_samples] *= fade_in
            wav[-fade_samples:] *= fade_out
        pieces.append(wav)
        if pause_ms > 0:
            pieces.append(torch.zeros(int(sr * pause_ms / 1000.0), dtype=torch.float32))

    return torch.cat(pieces, dim=0).unsqueeze(0)


def synthesize_script(
    model: Any,
    job: ShortJob,
    script: ViralScript,
    locale_cfg: LocaleConfig,
    voice: VoiceProfile,
) -> Path:
    ref_path: Path | None = Path(job.voice_ref) if job.voice_ref else voice.voice_ref
    audio_prompt = str(ref_path) if ref_path and ref_path.exists() else None

    segments_to_speak: list[tuple[str, int]] = [(script.hook, 260)]
    for beat in script.beats:
        chunks = _split_sentences(beat.text)
        for i, chunk in enumerate(chunks):
            pause = beat.pause_after_ms if i == len(chunks) - 1 else 140
            segments_to_speak.append((chunk, pause))

    rendered_audio: list[tuple[torch.Tensor, int]] = []
    for text, pause_ms in segments_to_speak:
        spoken_text = _normalize_roman_numerals_for_tts(text, locale_cfg.whisper_lang)
        _set_seed(voice.seed)
        kwargs: dict[str, Any] = {
            "exaggeration": voice.exaggeration,
            "cfg_weight": voice.cfg_weight,
            "temperature": voice.temperature,
        }
        if audio_prompt:
            kwargs["audio_prompt_path"] = audio_prompt
        if hasattr(model, "generate") and type(model).__name__ == "ChatterboxMultilingualTTS":
            kwargs["language_id"] = locale_cfg.whisper_lang

        wav = model.generate(spoken_text, **kwargs)
        rendered_audio.append((wav, pause_ms))

    stitched = _stitch_segments(rendered_audio, model.sr)
    out_path = get_job_dir(job.id) / "raw.wav"
    ta.save(str(out_path), stitched, model.sr)
    return out_path
