from __future__ import annotations

import csv
from pathlib import Path

from pipeline.config import ShortJob

CSV_FIELDS = ["id", "prompt", "locale", "voice_ref", "reference_url", "theme", "status"]


def read_jobs(csv_path: Path) -> list[ShortJob]:
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        jobs: list[ShortJob] = []
        for row in reader:
            if not row.get("id") or not row.get("prompt"):
                continue
            jobs.append(
                ShortJob(
                    id=row["id"].strip(),
                    prompt=row["prompt"].strip(),
                    locale=(row.get("locale") or "es-ES").strip(),
                    voice_ref=(row.get("voice_ref") or "").strip(),
                    reference_url=(row.get("reference_url") or "").strip(),
                    theme=(row.get("theme") or "editorial_dark").strip(),
                    status=(row.get("status") or "pending").strip(),
                )
            )
        return jobs


def update_job_status(csv_path: Path, job_id: str, new_status: str) -> None:
    jobs = read_jobs(csv_path)
    tmp_path = csv_path.with_suffix(".csv.tmp")
    with tmp_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for job in jobs:
            if job.id == job_id:
                job.status = new_status
            writer.writerow(job.model_dump())
    tmp_path.replace(csv_path)
