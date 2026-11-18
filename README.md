# Grounded Historical TikTok / Shorts Pipeline

Local Apple Silicon pipeline that turns a CSV of historical prompts into **1080×1920 @ 60fps** vertical Shorts using **Wikipedia/Wikidata grounding**, **locale-specialized Resemble AI Chatterbox TTS**, **WhisperX word alignment**, and **Remotion**—with zero AI image or video generation.

## Setup

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with LLM_BASE_URL, LLM_MODEL, LLM_API_KEY, and DEFAULT_VOICE_REF
   ```

2. **Install Python environment (`uv` + Python 3.11/3.12)**
   ```bash
   uv venv --python 3.12
   uv pip install -e .
   ```

3. **Install Remotion renderer dependencies**
   ```bash
   cd renderer && npm install && cd ..
   ```

4. **Add your narrator reference voice (optional, for locked voice consistency)**
   Place a clean 5–15 second `.wav` recording at `assets/voices/narrator.wav` (or update `DEFAULT_VOICE_REF` in `.env`).

## Usage

Check batch status:
```bash
uv run shorts status jobs/shorts.csv
```

Run the full stage-by-stage pipeline (models are automatically unloaded between stages):
```bash
uv run shorts run jobs/shorts.csv
```

Outputs are written to `output/<id>/final.mp4` alongside `sources.json`, `script.json`, `audio.wav`, and `props.json`.
