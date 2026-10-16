#!/usr/bin/env python3
"""Refresh Google Scholar citation metrics weekly, retaining last successful values on blocks."""
from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "scholar-metrics.json"
SCHOLAR_ID = "F0ZcWaMAAAAJ"


def main() -> int:
    if not CACHE.exists():
        print(f"Missing cache file: {CACHE}", file=sys.stderr)
        return 2
    data = json.loads(CACHE.read_text(encoding="utf-8"))
    try:
        from scholarly import scholarly
        author = scholarly.search_author_id(SCHOLAR_ID)
        author = scholarly.fill(author, sections=["basics", "indices", "counts"])
        raw = {
            "citations": author.get("citedby"),
            "hIndex": author.get("hindex"),
            "i10Index": author.get("i10index"),
        }
        metrics = {}
        for key, value in raw.items():
            if value is None or str(value).strip() == "":
                raise ValueError(f"Scholar profile did not return required metric: {key}")
            number = int(value)
            if number < 0:
                raise ValueError(f"Invalid negative metric: {key}")
            metrics[key] = number
        if set(metrics) != {"citations", "hIndex", "i10Index"}:
            raise ValueError("Incomplete metric set")
    except Exception as exc:
        # Google Scholar may rate-limit automated requests or require a CAPTCHA. Do not
        # overwrite known-good metrics with blanks or guessed numbers in that case.
        print(f"[CACHED] Could not refresh Google Scholar metrics: {type(exc).__name__}: {str(exc)[:220]}")
        return 0

    today = datetime.now(timezone.utc).date().isoformat()
    old = data.get("metrics", {})
    changed = old != metrics or data.get("lastSuccessfulRefresh") != today
    if changed:
        data["metrics"] = metrics
        data["lastSuccessfulRefresh"] = today
        data["profileId"] = SCHOLAR_ID
        data["profileUrl"] = f"https://scholar.google.com/citations?hl=en&user={SCHOLAR_ID}"
        data["refreshCadence"] = "weekly"
        CACHE.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"[UPDATED] Scholar metrics refreshed on {today}: {metrics}")
    else:
        print(f"[OK] Weekly check succeeded; metric values unchanged: {metrics}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
