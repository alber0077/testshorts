from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from pipeline.audio.aligner import WhisperXAligner
from pipeline.audio.master import master_audio
from pipeline.compiler import compile_render_props
from pipeline.config import ROOT_DIR, GroundedContext, ShortJob, ViralScript, get_job_dir, load_settings
from pipeline.csv_store import read_jobs, update_job_status
from pipeline.grounding.scriptwriter import generate_grounded_script
from pipeline.grounding.wikipedia import ground_job
from pipeline.memory import managed_model, resolve_device
from pipeline.render_bridge import render_video
from pipeline.tts.router import load_chatterbox_for_locale
from pipeline.tts.synthesizer import synthesize_script

app = typer.Typer(help="Grounded historical TikTok/Shorts pipeline (Chatterbox TTS + Remotion).")
console = Console()
DEFAULT_CSV = ROOT_DIR / "jobs" / "shorts.csv"


def _load_json(path: Path, model_cls: type):
    return model_cls.model_validate_json(path.read_text(encoding="utf-8"))


@app.command()
def status(csv_path: Path = typer.Argument(DEFAULT_CSV)) -> None:
    """Show the current status of all jobs in the CSV."""
    jobs = read_jobs(csv_path)
    table = Table(title=f"Shorts Batch ({csv_path.name})")
    table.add_column("ID", style="cyan")
    table.add_column("Locale")
    table.add_column("Theme")
    table.add_column("Status", style="green")
    table.add_column("Prompt", max_width=50)
    for job in jobs:
        table.add_row(job.id, job.locale, job.theme, job.status, job.prompt)
    console.print(table)


@app.command()
def run(
    csv_path: Path = typer.Argument(DEFAULT_CSV),
    only_id: str = typer.Option("", "--id", help="Run only a single job ID from the CSV."),
) -> None:
    """Run all pipeline stages batch-by-batch, unloading models between each stage."""
    settings = load_settings()
    jobs = read_jobs(csv_path)
    if only_id:
        jobs = [j for j in jobs if j.id == only_id]
        if not jobs:
            raise typer.BadParameter(f"Job ID '{only_id}' not found in {csv_path}.")

    # Stage 1 & 2: Historical Grounding + Grounded Script Generation
    for job in jobs:
        if job.status in ("pending", "failed"):
            locale_cfg = settings.locales[job.locale]
            console.print(f"[bold cyan][Ground][/bold cyan] {job.id} ({job.locale})")
            ctx = ground_job(job, locale_cfg.wiki_lang)
            console.print(f"[bold cyan][Script][/bold cyan] {job.id} ({len(ctx.passages)} sources)")
            generate_grounded_script(job, ctx, settings)
            update_job_status(csv_path, job.id, "scripted")
            job.status = "scripted"

    # Stage 3: Chatterbox TTS grouped by locale (loads once per locale, then unloads)
    tts_jobs = [j for j in jobs if j.status == "scripted"]
    by_locale: dict[str, list[ShortJob]] = defaultdict(list)
    for job in tts_jobs:
        by_locale[job.locale].append(job)

    for locale, group in by_locale.items():
        locale_cfg = settings.locales[locale]
        console.print(f"[bold magenta][TTS Load][/bold magenta] {locale} -> {locale_cfg.chatterbox_repo}")
        with managed_model(lambda cfg=locale_cfg: load_chatterbox_for_locale(cfg, settings.device)) as model:
            for job in group:
                console.print(f"[bold magenta][TTS][/bold magenta] {job.id}")
                script = _load_json(get_job_dir(job.id) / "script.json", ViralScript)
                synthesize_script(model, job, script, locale_cfg, settings.voice)
                update_job_status(csv_path, job.id, "tts_done")
                job.status = "tts_done"
        console.print(f"[dim]Unloaded Chatterbox ({locale}) from memory.[/dim]")

    # Stage 4: FFmpeg Mastering + WhisperX Alignment (loads once per whisper_lang, then unloads)
    align_jobs = [j for j in jobs if j.status == "tts_done"]
    by_lang: dict[str, list[ShortJob]] = defaultdict(list)
    for job in align_jobs:
        by_lang[settings.locales[job.locale].whisper_lang].append(job)

    device = resolve_device(settings.device)
    for lang, group in by_lang.items():
        console.print(f"[bold yellow][Align Load][/bold yellow] WhisperX ({lang})")
        aligner = WhisperXAligner(settings.whisper_model, lang, device)
        try:
            for job in group:
                console.print(f"[bold yellow][Align][/bold yellow] {job.id}")
                job_dir = get_job_dir(job.id)
                duration_sec = master_audio(job_dir / "raw.wav", job_dir / "audio.wav")
                script = _load_json(job_dir / "script.json", ViralScript)
                words = aligner.align(job_dir / "audio.wav", script, duration_sec)
                compile_render_props(job, script, words, job_dir / "audio.wav", duration_sec, settings.fps)
                update_job_status(csv_path, job.id, "aligned")
                job.status = "aligned"
        finally:
            aligner.close()
        console.print(f"[dim]Unloaded WhisperX ({lang}) from memory.[/dim]")

    # Stage 5: Remotion 60fps High-Quality Render (no ML models in memory)
    for job in jobs:
        if job.status == "aligned":
            console.print(f"[bold green][Render][/bold green] {job.id} (1080x1920 @ {settings.fps}fps)")
            out_mp4 = render_video(job.id, settings.max_duration_sec)
            update_job_status(csv_path, job.id, "done")
            console.print(f"[bold green][Done][/bold green] {out_mp4}")


if __name__ == "__main__":
    app()
