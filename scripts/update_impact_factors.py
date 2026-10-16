#!/usr/bin/env python3
"""Refresh cached journal Impact Factors from publisher-hosted journal pages.

Publisher pages differ structurally. This updater uses conservative text patterns and
retains the previous value whenever the publisher cannot be fetched or parsed safely.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import json
import re
import sys
import time

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "impact-factors.json"
USER_AGENT = "Mozilla/5.0 (compatible; JournalImpactFactorCache/1.0; +https://github.com/nsdhakad/narendra)"
TIMEOUT = 35

# URLs are official publisher/journal pages, not third-party metric aggregators.
SOURCES = {
    "ieee-tcas-i": ("https://ieee-cas.org/publication/TCAS-I", "label-value"),
    "frontiers-nanotechnology": ("https://www.frontiersin.org/journals/nanotechnology/about", "either"),
    "ieee-trans-nanotechnology": ("https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=7729", "either"),
    "ieee-embedded-systems-letters": ("https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=4563995", "either"),
    "analog-integrated-circuits-and-signal-processing": ("https://link.springer.com/journal/10470", "springer"),
    "circuits-systems-signal-processing": ("https://link.springer.com/journal/34", "springer"),
    "ieee-trans-electron-devices": ("https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=16", "either"),
    "journal-computational-electronics": ("https://link.springer.com/journal/10825", "springer"),
    "neurocomputing": ("https://www.sciencedirect.com/journal/neurocomputing", "either"),
    "microelectronics-reliability": ("https://www.sciencedirect.com/journal/microelectronics-reliability", "either"),
}

NUM = r"(?P<value>\d{1,2}(?:\.\d{1,3})?)"
YEAR = r"(?:\s*\(\s*(?P<year>20\d{2})\s*\))?"


def extract_metric(html_text: str, parser_kind: str) -> tuple[str, int | None] | None:
    soup = BeautifulSoup(html_text, "html.parser")
    for node in soup(["script", "style", "noscript", "svg", "template"]):
        node.decompose()
    text = soup.get_text("\n", strip=True).replace("\xa0", " ")
    text = re.sub(r"[ \t\r]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)

    patterns: list[str] = []
    if parser_kind == "springer":
        patterns.extend([
            rf"Journal\s+Impact\s+Factor\s*[:\n\-–— ]*{NUM}{YEAR}",
            rf"Journal\s+Impact\s+Factor\s*[:\n\-–— ]*{NUM}",
        ])
    if parser_kind in ("label-value", "either", "springer"):
        patterns.extend([
            rf"(?<!5-Year )(?<!Five-Year )(?:Journal\s+)?Impact\s+Factor(?:\s*\(\s*(?:JCR|Clarivate|Journal Citation Reports|20\d{{4}})\s*\))?\s*[:\-–—]?\s*{NUM}{YEAR}",
            rf"(?:Journal\s+)?Impact\s+Factor\s*\n\s*{NUM}{YEAR}",
        ])
    if parser_kind in ("value-label", "either", "springer"):
        patterns.extend([
            rf"{NUM}\s+(?:Journal\s+)?Impact\s+Factor\b{YEAR}",
        ])

    for pattern in patterns:
        for match in re.finditer(pattern, text, re.I):
            try:
                value = float(match.group("value"))
            except (TypeError, ValueError):
                continue
            # Reject implausible matches from unrelated text or a bare 5-year IF heading.
            if not (0 < value < 100):
                continue
            raw_year = match.groupdict().get("year")
            year = int(raw_year) if raw_year and 2000 <= int(raw_year) <= 2100 else None
            return f"{value:g}", year
    return None


def main() -> int:
    if not CACHE.exists():
        print(f"Missing cache file: {CACHE}", file=sys.stderr)
        return 2
    data = json.loads(CACHE.read_text(encoding="utf-8"))
    journals = data.setdefault("journals", {})
    today = datetime.now(timezone.utc).date().isoformat()
    data["lastAttemptAt"] = today
    changed = False
    successes = 0
    failures = 0
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"})

    for key, (url, parser_kind) in SOURCES.items():
        record = journals.get(key)
        if not isinstance(record, dict):
            print(f"[SKIP] {key}: no cache record", flush=True)
            failures += 1
            continue
        old_value = str(record.get("value", ""))
        try:
            response = session.get(url, timeout=TIMEOUT)
            response.raise_for_status()
            parsed = extract_metric(response.text, parser_kind)
            if not parsed:
                raise ValueError("publisher page fetched, but no unambiguous Impact Factor pattern was found")
            value, metric_year = parsed
            record["value"] = value
            record["url"] = url
            record["lastCheckedAt"] = today
            record["status"] = "live"
            record["lastFetchStatus"] = "success"
            record["metricYear"] = metric_year
            changed = changed or (old_value != value)
            successes += 1
            print(f"[OK] {key}: {old_value or 'unset'} -> {value}" + (f" (metric year {metric_year})" if metric_year else ""), flush=True)
        except Exception as exc:  # retain cached value on publisher/parser errors
            record["lastFetchStatus"] = "cached"
            record["lastError"] = str(exc)[:240]
            failures += 1
            print(f"[CACHED] {key}: keeping {old_value or 'no value'}; {exc}", flush=True)
        time.sleep(0.5)

    data["lastAttemptAt"] = today
    if successes:
        data["lastSuccessfulRefresh"] = today
    # Persist dates and failure diagnostics while never discarding the last good metric.
    CACHE.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Refresh complete: {successes} publisher pages parsed, {failures} using cached values.")
    return 0  # A blocked publisher must not fail the whole monthly workflow.


if __name__ == "__main__":
    raise SystemExit(main())
