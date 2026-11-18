from __future__ import annotations

import re
from urllib.parse import quote, unquote, urlparse

import httpx
from bs4 import BeautifulSoup

from pipeline.config import GroundedContext, ShortJob, SourcePassage, get_job_dir

USER_AGENT = "HistoryShortsPipeline/0.1 (grounded-research-bot)"
MAX_EXTRACT_CHARS = 3500


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _fetch_wikipedia_page(client: httpx.Client, lang: str, title: str) -> tuple[str, str, str] | None:
    api_url = f"https://{lang}.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "prop": "extracts|info",
        "exintro": False,
        "explaintext": True,
        "exchars": MAX_EXTRACT_CHARS,
        "inprop": "url",
        "titles": title,
        "format": "json",
        "redirects": 1,
    }
    resp = client.get(api_url, params=params)
    resp.raise_for_status()
    pages = resp.json().get("query", {}).get("pages", {})
    for page in pages.values():
        if page.get("missing") is not None:
            continue
        extract = _clean_text(page.get("extract", ""))
        if extract:
            return page.get("title", title), page.get("fullurl", f"https://{lang}.wikipedia.org/wiki/{quote(title)}"), extract
    return None


def _search_wikipedia_titles(client: httpx.Client, lang: str, query: str, limit: int = 3) -> list[str]:
    api_url = f"https://{lang}.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": limit,
        "format": "json",
    }
    resp = client.get(api_url, params=params)
    resp.raise_for_status()
    results = resp.json().get("query", {}).get("search", [])
    return [r["title"] for r in results if r.get("title")]


def _fetch_custom_url(client: httpx.Client, url: str) -> tuple[str, str, str] | None:
    parsed = urlparse(url)
    if "wikipedia.org" in parsed.netloc and "/wiki/" in parsed.path:
        lang = parsed.netloc.split(".")[0]
        title = unquote(parsed.path.split("/wiki/", 1)[1])
        return _fetch_wikipedia_page(client, lang, title)

    resp = client.get(url, follow_redirects=True)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    title = _clean_text(soup.title.string) if soup.title and soup.title.string else url
    paragraphs = [_clean_text(p.get_text(" ")) for p in soup.find_all("p")]
    extract = " ".join(p for p in paragraphs if len(p) > 40)[:MAX_EXTRACT_CHARS]
    if not extract:
        return None
    return title, str(resp.url), extract


def ground_job(job: ShortJob, wiki_lang: str) -> GroundedContext:
    passages: list[SourcePassage] = []
    seen_urls: set[str] = set()

    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=20.0) as client:
        if job.reference_url:
            fetched = _fetch_custom_url(client, job.reference_url)
            if fetched:
                title, url, extract = fetched
                seen_urls.add(url)
                passages.append(
                    SourcePassage(source_id=f"S{len(passages) + 1}", title=title, url=url, extract=extract)
                )

        titles = _search_wikipedia_titles(client, wiki_lang, job.prompt, limit=3)
        if not titles and wiki_lang != "en":
            titles = _search_wikipedia_titles(client, "en", job.prompt, limit=2)
            search_lang = "en"
        else:
            search_lang = wiki_lang

        for title in titles:
            fetched = _fetch_wikipedia_page(client, search_lang, title)
            if not fetched:
                continue
            page_title, url, extract = fetched
            if url in seen_urls:
                continue
            seen_urls.add(url)
            passages.append(
                SourcePassage(source_id=f"S{len(passages) + 1}", title=page_title, url=url, extract=extract)
            )

    if not passages:
        raise RuntimeError(f"No verifiable historical sources found for job '{job.id}' ({job.prompt}).")

    context = GroundedContext(job_id=job.id, locale=job.locale, query=job.prompt, passages=passages)
    out_path = get_job_dir(job.id) / "sources.json"
    out_path.write_text(context.model_dump_json(indent=2), encoding="utf-8")
    return context
