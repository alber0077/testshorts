from __future__ import annotations

from pathlib import Path
from typing import Any

import torch
from huggingface_hub import hf_hub_download, list_repo_files, snapshot_download
from safetensors.torch import load_file as load_safetensors

from pipeline.config import LocaleConfig
from pipeline.memory import resolve_device

BASE_REPO = "ResembleAI/chatterbox"


def _load_v3_single_language(repo_id: str, device: str) -> Any:
    from chatterbox.models.s3gen import S3Gen
    from chatterbox.models.t3 import T3
    from chatterbox.models.t3.modules.t3_config import T3Config
    from chatterbox.models.tokenizers import MTLTokenizer
    from chatterbox.models.voice_encoder import VoiceEncoder
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS, Conditionals

    map_location = torch.device("cpu") if device in ("cpu", "mps") else None

    repo_files = list_repo_files(repo_id)
    t3_file = next((f for f in repo_files if f.startswith("t3_") and f.endswith(".safetensors")), None)
    if not t3_file:
        raise RuntimeError(f"Could not find t3_*.safetensors in {repo_id}")

    s3gen_file = "s3gen_v3.pt" if "s3gen_v3.pt" in repo_files else "s3gen.pt"
    tok_file = "grapheme_mtl_merged_expanded_v1.json"

    pack_dir = Path(
        snapshot_download(
            repo_id=repo_id,
            repo_type="model",
            allow_patterns=[t3_file, s3gen_file, tok_file],
        )
    )

    ve_path = hf_hub_download(repo_id=BASE_REPO, filename="ve.pt")
    conds_path = hf_hub_download(repo_id=BASE_REPO, filename="conds.pt")
    # MTLTokenizer expects Cangjie5_TC.json alongside or in the same dir if referenced
    base_dir = Path(ve_path).parent
    if not (pack_dir / "Cangjie5_TC.json").exists():
        try:
            cj_path = hf_hub_download(repo_id=BASE_REPO, filename="Cangjie5_TC.json")
            (pack_dir / "Cangjie5_TC.json").symlink_to(cj_path)
        except Exception:
            pass

    ve = VoiceEncoder()
    ve.load_state_dict(torch.load(ve_path, map_location=map_location, weights_only=True))
    ve.to(device).eval()

    t3 = T3(T3Config.multilingual())
    t3_state = load_safetensors(pack_dir / t3_file)
    if "model" in t3_state:
        t3_state = t3_state["model"][0]
    t3.load_state_dict(t3_state)
    t3.to(device).eval()

    s3gen = S3Gen()
    s3gen_state = torch.load(pack_dir / s3gen_file, map_location=map_location, weights_only=True)
    missing, unexpected = s3gen.load_state_dict(s3gen_state, strict=False)
    allowed_missing = {"tokenizer._mel_filters", "tokenizer.window"}
    bad_missing = [k for k in missing if k not in allowed_missing]
    if bad_missing or unexpected:
        raise RuntimeError(f"Unexpected S3Gen state_dict mismatch: missing={bad_missing}, unexpected={unexpected}")
    s3gen.to(device).eval()

    tokenizer = MTLTokenizer(str(pack_dir / tok_file))
    conds = Conditionals.load(conds_path, map_location=map_location).to(device)

    import perth

    if getattr(perth, "PerthImplicitWatermarker", None) is None:
        perth.PerthImplicitWatermarker = perth.DummyWatermarker

    return ChatterboxMultilingualTTS(t3, s3gen, ve, tokenizer, device, conds=conds)


def load_chatterbox_for_locale(locale_cfg: LocaleConfig, preferred_device: str = "auto") -> Any:
    """Load the locale-specialized Chatterbox TTS checkpoint onto the target device."""
    device = resolve_device(preferred_device)

    if locale_cfg.chatterbox_repo == BASE_REPO:
        if locale_cfg.fallback_multilingual:
            from chatterbox.mtl_tts import ChatterboxMultilingualTTS

            return ChatterboxMultilingualTTS.from_pretrained(device=device)
        from chatterbox.tts import ChatterboxTTS

        return ChatterboxTTS.from_pretrained(device=device)

    return _load_v3_single_language(locale_cfg.chatterbox_repo, device)
