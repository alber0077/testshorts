from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

import yaml
from dotenv import load_dotenv
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parent.parent


class LocaleConfig(BaseModel):
    name: str
    wiki_lang: str
    whisper_lang: str
    chatterbox_repo: str
    fallback_multilingual: bool = False


class VoiceProfile(BaseModel):
    voice_ref: Path | None = None
    exaggeration: float = 0.55
    cfg_weight: float = 0.50
    temperature: float = 0.70
    seed: int = 42


class Settings(BaseModel):
    llm_base_url: str
    llm_model: str
    llm_api_key: str
    voice: VoiceProfile
    device: str = "auto"
    whisper_model: str = "large-v3-turbo"
    fps: int = 60
    max_duration_sec: float = 130.0
    locales: dict[str, LocaleConfig]


class ShortJob(BaseModel):
    id: str
    prompt: str
    locale: str
    voice_ref: str = ""
    reference_url: str = ""
    theme: str = "editorial_dark"
    status: str = "pending"


class SourcePassage(BaseModel):
    source_id: str
    title: str
    url: str
    extract: str


class GroundedContext(BaseModel):
    job_id: str
    locale: str
    query: str
    passages: list[SourcePassage]


class CartoonActor(BaseModel):
    role: Literal["emperor", "sultan", "soldier", "engineer", "scholar", "sailor", "ox_team"] = "soldier"
    side: Literal["left", "center", "right"] = "center"
    facing: Literal["left", "right"] = "right"
    action: Literal["idle", "march", "command", "reject", "haul", "celebrate", "panic"] = "idle"
    label: str = ""


class VisualSpec(BaseModel):
    headline: str = ""
    sublabel: str = ""
    metric_value: str = ""
    camera_motion: Literal["zoom_in", "pan_left", "pan_right", "shake", "float"] = "zoom_in"
    backdrop: Literal[
        "night_siege",
        "day_plains",
        "mediterranean_sea",
        "palace_court",
        "ancient_library",
        "storm_battle",
    ] = "night_siege"
    landmark: Literal[
        "fortress_walls",
        "palace_columns",
        "temple_library",
        "harbor_ships",
        "camp_tents",
        "none",
    ] = "fortress_walls"
    landmark_state: Literal["intact", "smoking", "breached"] = "intact"
    actors: list[CartoonActor] = Field(default_factory=list)
    props: list[
        Literal[
            "giant_cannon",
            "blueprint_scroll",
            "gold_coins",
            "warship",
            "scroll_stack",
            "treaty_seal",
            "crossed_swords",
        ]
    ] = Field(default_factory=list)
    fx: list[
        Literal["cannon_fire", "smoke_plumes", "sparks", "dust_cloud", "falling_stones", "clouds"]
    ] = Field(default_factory=list)


class ScriptBeat(BaseModel):
    text: str
    emphasis_words: list[str] = Field(default_factory=list)
    source_ids: list[str] = Field(default_factory=list)
    pause_after_ms: int = 220
    visual: VisualSpec = Field(default_factory=VisualSpec)


class Citation(BaseModel):
    source_id: str
    title: str
    url: str


class ViralScript(BaseModel):
    job_id: str
    locale: str
    title: str
    era_label: str
    year: str
    hook: str
    hook_source_ids: list[str] = Field(default_factory=list)
    hook_visual: VisualSpec = Field(default_factory=VisualSpec)
    beats: list[ScriptBeat]
    citations: list[Citation]


def load_settings(env_path: Path | None = None) -> Settings:
    load_dotenv(env_path or ROOT_DIR / ".env")
    locales_file = ROOT_DIR / "config" / "locales.yaml"
    raw_locales = yaml.safe_load(locales_file.read_text(encoding="utf-8"))["locales"]
    locales = {k: LocaleConfig(**v) for k, v in raw_locales.items()}

    raw_voice_ref = os.getenv("DEFAULT_VOICE_REF", "").strip()
    voice_ref_path = (ROOT_DIR / raw_voice_ref) if raw_voice_ref else None

    return Settings(
        llm_base_url=os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/"),
        llm_model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
        llm_api_key=os.getenv("LLM_API_KEY", ""),
        voice=VoiceProfile(
            voice_ref=voice_ref_path,
            exaggeration=float(os.getenv("TTS_EXAGGERATION", "0.55")),
            cfg_weight=float(os.getenv("TTS_CFG_WEIGHT", "0.50")),
            temperature=float(os.getenv("TTS_TEMPERATURE", "0.70")),
            seed=int(os.getenv("TTS_SEED", "42")),
        ),
        device=os.getenv("PIPELINE_DEVICE", "auto"),
        whisper_model=os.getenv("WHISPER_MODEL", "large-v3-turbo"),
        locales=locales,
    )


def get_job_dir(job_id: str) -> Path:
    path = ROOT_DIR / "output" / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path
