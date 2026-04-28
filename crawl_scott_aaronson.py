#!/usr/bin/env python3
import json
import re
import html
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import requests

BASE = "https://scottaaronson.blog/"
HEADERS = {"User-Agent": "Mozilla/5.0 (OpenClaw research crawler; +https://openclaw.ai)"}
ROOT = Path("/home/sunggyu/.openclaw/workspace/projects/scott-aaronson-idea-atlas")
DATA = ROOT / "data"
DATA.mkdir(parents=True, exist_ok=True)


def fetch(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def clean_text(raw: str) -> str:
    raw = re.sub(r"<script\b.*?</script>", " ", raw, flags=re.S | re.I)
    raw = re.sub(r"<style\b.*?</style>", " ", raw, flags=re.S | re.I)
    raw = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    raw = re.sub(r"</p>\s*", "\n\n", raw, flags=re.I)
    raw = re.sub(r"</li>\s*", "\n", raw, flags=re.I)
    raw = re.sub(r"<[^>]+>", " ", raw)
    raw = html.unescape(raw)
    raw = raw.replace("\xa0", " ")
    raw = re.sub(r"[ \t]+", " ", raw)
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    return raw.strip()


def extract_archive_months(home_html: str) -> List[str]:
    months = re.findall(r"href='https://scottaaronson\.blog/\?m=(20(?:20|21|22|23|24|25|26)\d{2})'", home_html)
    return sorted(set(months))


def parse_archive_posts(archive_html: str) -> List[Dict]:
    posts = []
    pattern = re.compile(
        r'<div class="post">.*?<h3 id="post-(\d+)"><a href="([^"]+)"[^>]*>(.*?)</a></h3>\s*<small>(.*?)</small>',
        re.S,
    )
    for m in pattern.finditer(archive_html):
        post_id, link, title_html, date_html = m.groups()
        title = clean_text(title_html)
        date_text = clean_text(date_html)
        posts.append({
            "id": int(post_id),
            "url": html.unescape(link),
            "title": title,
            "date_text": date_text,
        })
    return posts


def extract_post_content(post_html: str) -> Dict:
    title = None
    m = re.search(r'<meta property="og:title" content="([^"]+)"', post_html)
    if m:
        title = html.unescape(m.group(1))
    if not title:
        m = re.search(r'<title>.*?Permanent Link to (.*?)</title>', post_html, re.S)
        if m:
            title = clean_text(m.group(1))

    published_iso = None
    m = re.search(r'<meta property="article:published_time" content="([^"]+)"', post_html)
    if m:
        published_iso = m.group(1)

    entry_html = ""
    m = re.search(r'<div class="entry">(.*?)<p class="postmetadata alt">', post_html, re.S)
    if m:
        entry_html = m.group(1)
    else:
        m = re.search(r'<div class="entry">(.*?)</div>\s*</div>\s*</div>', post_html, re.S)
        if m:
            entry_html = m.group(1)

    metadata_html = ""
    m = re.search(r'<p class="postmetadata alt">\s*<small>(.*?)</small>', post_html, re.S)
    if m:
        metadata_html = m.group(1)

    categories = [clean_text(x) for x in re.findall(r'rel="category">(.*?)</a>', metadata_html, re.S)]

    comment_count = None
    m = re.search(r'<h3 id="comments">\s*(\d+) Responses? to', post_html)
    if m:
        comment_count = int(m.group(1))
    else:
        m = re.search(r'One Response to', post_html)
        if m:
            comment_count = 1

    return {
        "title": title,
        "published_iso": published_iso,
        "categories": categories,
        "content_text": clean_text(entry_html),
        "content_chars": len(clean_text(entry_html)),
        "comment_count": comment_count,
    }


def main():
    home_html = fetch(BASE)
    months = [m for m in extract_archive_months(home_html) if 202001 <= int(m) <= 202612]

    archive_inventory = []
    seen_ids = set()
    posts = []

    for ym in months:
        archive_url = f"{BASE}?m={ym}"
        archive_html = fetch(archive_url)
        month_posts = parse_archive_posts(archive_html)
        archive_inventory.append({
            "month": ym,
            "archive_url": archive_url,
            "post_count": len(month_posts),
        })
        for p in month_posts:
            if p["id"] in seen_ids:
                continue
            seen_ids.add(p["id"])
            p["archive_month"] = ym
            posts.append(p)
        time.sleep(0.2)

    enriched = []
    failures = []
    for i, post in enumerate(posts, start=1):
        try:
            post_html = fetch(post["url"])
            details = extract_post_content(post_html)
            merged = {**post, **details}
            enriched.append(merged)
        except Exception as e:
            failures.append({"url": post["url"], "error": str(e)})
        time.sleep(0.2)

    monthly_counts = {item["month"]: item["post_count"] for item in archive_inventory}
    yearly_counts = Counter(p["archive_month"][:4] for p in enriched)
    category_counts = Counter()
    monthly_category_counts = defaultdict(Counter)
    for p in enriched:
        month = p["archive_month"]
        for c in p.get("categories", []):
            category_counts[c] += 1
            monthly_category_counts[month][c] += 1

    summary = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "month_count": len(months),
        "post_count": len(enriched),
        "failed_posts": len(failures),
        "monthly_counts": monthly_counts,
        "yearly_counts": dict(sorted(yearly_counts.items())),
        "top_categories": category_counts.most_common(20),
    }

    (DATA / "archive_inventory.json").write_text(json.dumps(archive_inventory, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "posts_2020_2026.json").write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "crawl_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "crawl_failures.json").write_text(json.dumps(failures, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = []
    lines.append("# Scott Aaronson 2020-2026 Crawl Summary")
    lines.append("")
    lines.append(f"- Generated at: {summary['generated_at']}")
    lines.append(f"- Archive months crawled: {summary['month_count']}")
    lines.append(f"- Posts captured: {summary['post_count']}")
    lines.append(f"- Failed post fetches: {summary['failed_posts']}")
    lines.append("")
    lines.append("## Yearly post counts")
    for year, count in sorted(yearly_counts.items()):
        lines.append(f"- {year}: {count}")
    lines.append("")
    lines.append("## Monthly post counts")
    for month, count in sorted(monthly_counts.items()):
        lines.append(f"- {month}: {count}")
    lines.append("")
    lines.append("## Top categories")
    for cat, count in category_counts.most_common(20):
        lines.append(f"- {cat}: {count}")
    (ROOT / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
