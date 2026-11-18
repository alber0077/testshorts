from __future__ import annotations

import re
import unicodedata
from contextlib import contextmanager
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Iterator

import torch
import whisperx
from pydantic import BaseModel

from pipeline.config import ViralScript
from pipeline.memory import clear_accelerator_cache


@contextmanager
def _legacy_torch_load() -> Iterator[None]:
    """Allow trusted WhisperX/pyannote checkpoints under PyTorch 2.6+."""
    orig_load = torch.load

    def _patched_load(*args: Any, **kwargs: Any) -> Any:
        if kwargs.get("weights_only") is None:
            kwargs["weights_only"] = False
        return orig_load(*args, **kwargs)

    torch.load = _patched_load
    try:
        yield
    finally:
        torch.load = orig_load


class WordTiming(BaseModel):
    text: str
    start: float
    end: float
    is_emphasis: bool = False


_ROMAN_SPOKEN_MAP: dict[str, str] = {
    "i": "primero",
    "ii": "segundo",
    "iii": "tercero",
    "iv": "cuarto",
    "v": "quinto",
    "vi": "sexto",
    "vii": "septimo",
    "viii": "octavo",
    "ix": "noveno",
    "x": "decimo",
    "xi": "once",
    "xii": "doce",
    "xiii": "trece",
    "xiv": "catorce",
    "xv": "quince",
    "xvi": "dieciseis",
    "xvii": "diecisiete",
    "xviii": "dieciocho",
    "xix": "diecinueve",
    "xx": "veinte",
    "xxi": "veintiuno",
}


def _normalize(token: str) -> str:
    nfkd = unicodedata.normalize("NFKD", token.lower())
    stripped = "".join(c for c in nfkd if not unicodedata.combining(c))
    clean = re.sub(r"[^\w]", "", stripped)
    return _ROMAN_SPOKEN_MAP.get(clean, clean)


def _extract_script_tokens(script: ViralScript) -> list[tuple[str, bool]]:
    tokens: list[tuple[str, bool]] = []
    for word in script.hook.split():
        tokens.append((word, False))

    for beat in script.beats:
        emphasis_norms = {
            _normalize(part)
            for phrase in beat.emphasis_words
            for part in phrase.split()
            if _normalize(part)
        }
        for word in beat.text.split():
            is_emph = _normalize(word) in emphasis_norms and bool(_normalize(word))
            tokens.append((word, is_emph))
    return tokens


def _reconcile_tokens(
    script_tokens: list[tuple[str, bool]],
    aligned_words: list[dict[str, Any]],
    total_duration: float,
) -> list[WordTiming]:
    if not aligned_words:
        step = total_duration / max(1, len(script_tokens))
        return [
            WordTiming(text=tok, start=round(i * step, 3), end=round((i + 1) * step, 3), is_emphasis=emph)
            for i, (tok, emph) in enumerate(script_tokens)
        ]

    src_norms = [_normalize(t) for t, _ in script_tokens]
    asr_norms = [_normalize(w.get("word", "")) for w in aligned_words]
    matcher = SequenceMatcher(None, src_norms, asr_norms)

    timings: list[tuple[float | None, float | None]] = [(None, None)] * len(script_tokens)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for offset in range(i2 - i1):
                w = aligned_words[j1 + offset]
                if "start" in w and "end" in w:
                    timings[i1 + offset] = (float(w["start"]), float(w["end"]))
        elif tag == "replace" and (i2 - i1) > 0 and (j2 - j1) > 0:
            span_start = next((float(w["start"]) for w in aligned_words[j1:j2] if "start" in w), None)
            span_end = next((float(w["end"]) for w in reversed(aligned_words[j1:j2]) if "end" in w), None)
            if span_start is not None and span_end is not None:
                count = i2 - i1
                step = max(0.05, (span_end - span_start) / count)
                for k in range(count):
                    timings[i1 + k] = (span_start + k * step, span_start + (k + 1) * step)

    # Interpolate any remaining gaps smoothly
    result: list[WordTiming] = []
    last_end = 0.0
    for idx, (text, is_emph) in enumerate(script_tokens):
        s, e = timings[idx]
        if s is None or e is None:
            next_start = next((timings[k][0] for k in range(idx + 1, len(timings)) if timings[k][0] is not None), total_duration)
            s = last_end
            e = min(next_start, s + 0.25) if next_start > s else s + 0.15
        s = max(last_end, s)
        e = max(s + 0.05, e)
        last_end = e
        result.append(WordTiming(text=text, start=round(s, 3), end=round(e, 3), is_emphasis=is_emph))
    return result


class WhisperXAligner:
    """Manages WhisperX ASR + wav2vec2 alignment models for a batch, then unloads cleanly."""

    def __init__(self, whisper_model_name: str, lang: str, device: str) -> None:
        # WhisperX / faster-whisper runs reliably on CPU on Apple Silicon (CTranslate2 lacks MPS)
        asr_device = "cuda" if device == "cuda" else "cpu"
        compute_type = "float16" if asr_device == "cuda" else "int8"
        self.lang = lang
        self.asr_device = asr_device
        initial_prompt = (
            "Transcripción histórica en español. Convierte números romanos correctamente: "
            "Mehmed II, Constantino XI, Carlos V, Luis XIV, siglo XV, siglo XIX."
            if lang == "es"
            else "Historical transcription. Convert Roman numerals properly: "
            "Mehmed II, Constantine XI, Henry VIII, Louis XIV, 15th century."
        )
        with _legacy_torch_load():
            self.model = whisperx.load_model(
                whisper_model_name,
                asr_device,
                compute_type=compute_type,
                language=lang,
                asr_options={"initial_prompt": initial_prompt},
            )
            self.align_model, self.metadata = whisperx.load_align_model(language_code=lang, device=asr_device)

    def align(self, audio_path: Path, script: ViralScript, total_duration: float) -> list[WordTiming]:
        audio = whisperx.load_audio(str(audio_path))
        result = self.model.transcribe(audio, batch_size=8, language=self.lang)
        aligned = whisperx.align(
            result["segments"],
            self.align_model,
            self.metadata,
            audio,
            self.asr_device,
            return_char_alignments=False,
        )
        aligned_words: list[dict[str, Any]] = []
        for seg in aligned.get("segments", []):
            aligned_words.extend(seg.get("words", []))

        script_tokens = _extract_script_tokens(script)
        return _reconcile_tokens(script_tokens, aligned_words, total_duration)

    def close(self) -> None:
        del self.model
        del self.align_model
        del self.metadata
        clear_accelerator_cache()
