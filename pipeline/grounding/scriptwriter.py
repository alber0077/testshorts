from __future__ import annotations

import json
import time
from typing import Any

import httpx

from pipeline.config import (
    Citation,
    GroundedContext,
    Settings,
    ShortJob,
    ViralScript,
    get_job_dir,
)

SYSTEM_PROMPT = """You are an expert historical storyteller and cartoon scene director for viral 1 to 2 minute vertical Shorts (TikTok / Reels / YouTube Shorts).

STRICT GROUNDING RULES:
1. Use ONLY facts, dates, names, locations, and figures explicitly present in the provided SOURCES ([S1], [S2], ...).
2. NEVER invent, extrapolate, or assume any historical detail not found in the sources.
3. Every beat and the hook MUST cite at least one valid source_id from the provided sources.
4. Write naturally in the requested locale ({locale}), optimized for spoken narration (short sentences, punchy rhythm, high retention).
5. Target total spoken length: 175 to 260 words across the hook and 7 to 11 beats (so the video runs roughly 1 to 2 minutes).
6. For BOTH the hook and every beat, include a `visual` object directing our animated cartoon scene engine to depict what is being spoken:
   - `headline`: short 2-5 word uppercase scene title directly from that beat's facts
   - `sublabel`: short 3-7 word context line
   - `metric_value`: (optional) key number/year/measure like `"1453"`, `"500 kg"`, `"60 bueyes"`
   - `camera_motion`: `"zoom_in" | "pan_left" | "pan_right" | "shake" | "float"`
   - `backdrop`: `"night_siege" | "day_plains" | "mediterranean_sea" | "palace_court" | "ancient_library" | "storm_battle"`
   - `landmark`: `"fortress_walls" | "palace_columns" | "temple_library" | "harbor_ships" | "camp_tents" | "none"`
   - `landmark_state`: `"intact" | "smoking" | "breached"`
   - `actors`: 0 to 3 animated characters (`{{"role": "emperor|sultan|soldier|engineer|scholar|sailor|ox_team", "side": "left|center|right", "facing": "left|right", "action": "idle|march|command|reject|haul|celebrate|panic", "label": "short name"}}`)
   - `props`: list from `["giant_cannon", "blueprint_scroll", "gold_coins", "warship", "scroll_stack", "treaty_seal", "crossed_swords"]`
   - `fx`: list from `["cannon_fire", "smoke_plumes", "sparks", "dust_cloud", "falling_stones", "clouds"]`
7. Output ONLY valid JSON matching this exact schema:
{{
  "title": "Short internal/display title",
  "era_label": "Short era/location tag (e.g. 'Imperio otomano · 1453')",
  "year": "Main year string (e.g. '1453')",
  "hook": "Opening 1-sentence pattern-interrupt hook (max 18 words)",
  "hook_source_ids": ["S1"],
  "hook_visual": {{
    "headline": "MURALLAS DE CONSTANTINOPLA",
    "sublabel": "El cañón más grande del mundo",
    "metric_value": "1453",
    "camera_motion": "shake",
    "backdrop": "night_siege",
    "landmark": "fortress_walls",
    "landmark_state": "smoking",
    "actors": [
      {{"role": "sultan", "side": "left", "facing": "right", "action": "command", "label": "Mehmed II"}}
    ],
    "props": ["giant_cannon"],
    "fx": ["cannon_fire", "smoke_plumes"]
  }},
  "beats": [
    {{
      "text": "Spoken narration sentence(s) for this beat.",
      "emphasis_words": ["1-3 exact words from text to highlight visually"],
      "source_ids": ["S1"],
      "pause_after_ms": 220,
      "visual": {{
        "headline": "TRANSPORTE COLOSAL",
        "sublabel": "Sesenta bueyes y cuatrocientos hombres",
        "metric_value": "60 bueyes",
        "camera_motion": "pan_right",
        "backdrop": "day_plains",
        "landmark": "camp_tents",
        "landmark_state": "intact",
        "actors": [
          {{"role": "ox_team", "side": "left", "facing": "right", "action": "haul", "label": "60 bueyes"}},
          {{"role": "soldier", "side": "right", "facing": "right", "action": "march", "label": "400 hombres"}}
        ],
        "props": ["giant_cannon"],
        "fx": ["dust_cloud", "clouds"]
      }}
    }}
  ]
}}"""


def _build_user_prompt(job: ShortJob, context: GroundedContext) -> str:
    source_blocks = [
        f"[{p.source_id}] {p.title} ({p.url})\n{p.extract}"
        for p in context.passages
    ]
    return (
        f"LOCALE: {job.locale}\n"
        f"TOPIC PROMPT: {job.prompt}\n\n"
        f"SOURCES:\n" + "\n\n".join(source_blocks)
    )


def _validate_citations(raw: dict[str, Any], context: GroundedContext) -> list[Citation]:
    by_id = {p.source_id: p for p in context.passages}
    used_ids: list[str] = []

    for sid in raw.get("hook_source_ids", []):
        if sid not in by_id:
            raise ValueError(f"Invalid hook source_id '{sid}' not in grounded sources.")
        if sid not in used_ids:
            used_ids.append(sid)

    for idx, beat in enumerate(raw.get("beats", [])):
        sids = beat.get("source_ids", [])
        if not sids:
            raise ValueError(f"Beat {idx} has no source_ids; ungrounded beats are not allowed.")
        for sid in sids:
            if sid not in by_id:
                raise ValueError(f"Beat {idx} references unknown source_id '{sid}'.")
            if sid not in used_ids:
                used_ids.append(sid)

    if not used_ids:
        raise ValueError("Generated script has no citations.")

    return [Citation(source_id=sid, title=by_id[sid].title, url=by_id[sid].url) for sid in used_ids]


def generate_grounded_script(job: ShortJob, context: GroundedContext, settings: Settings) -> ViralScript:
    if not settings.llm_api_key:
        raise RuntimeError("LLM_API_KEY is missing in .env.")

    payload = {
        "model": settings.llm_model,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT.format(locale=job.locale)},
            {"role": "user", "content": _build_user_prompt(job, context)},
        ],
    }

    headers = {
        "Authorization": f"Bearer {settings.llm_api_key}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=90.0) as client:
        for attempt in range(3):
            resp = client.post(f"{settings.llm_base_url}/chat/completions", headers=headers, json=payload)
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < 2:
                time.sleep(2 ** attempt)
                continue
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            break

    raw = json.loads(content)
    citations = _validate_citations(raw, context)

    script = ViralScript(
        job_id=job.id,
        locale=job.locale,
        title=raw["title"],
        era_label=raw["era_label"],
        year=str(raw["year"]),
        hook=raw["hook"],
        hook_source_ids=raw.get("hook_source_ids", []),
        hook_visual=raw.get("hook_visual") or {},
        beats=raw.get("beats", []),
        citations=citations,
    )

    out_path = get_job_dir(job.id) / "script.json"
    out_path.write_text(script.model_dump_json(indent=2), encoding="utf-8")
    return script
