#!/usr/bin/env python3
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENRICHED = ROOT / "data" / "derived" / "enriched_posts.json"
OUT_MONTHS = ROOT / "data" / "derived" / "month_summaries.json"
OUT_YEARS = ROOT / "data" / "derived" / "year_summaries.json"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def top_items(counter: Counter, n: int):
    return [{"name": k, "count": v} for k, v in counter.most_common(n)]


def representative_posts(posts, n=5):
    ranked = sorted(posts, key=lambda p: (-len(p.get("summary_long", "")), -(p.get("comment_count") or 0), p.get("published_at") or ""))
    return [
        {
            "post_id": p["post_id"],
            "title": p["title"],
            "url": p["url"],
            "primary_topics": p.get("primary_topics", []),
        }
        for p in ranked[:n]
    ]


def build_month_summary(month: str, posts):
    topic_counts = Counter()
    tone_counts = Counter()
    entity_counts = Counter()
    stance_counts = Counter()
    for p in posts:
        topic_counts.update(p.get("primary_topics", []))
        tone_counts.update(p.get("tone", []))
        entity_counts.update([e["name"] for e in p.get("named_entities", [])])
        for claim in p.get("key_claims", []):
            if claim.get("stance_target"):
                stance_counts.update([claim["stance_target"]])

    dominant_topics = top_items(topic_counts, 5)
    top_tones = top_items(tone_counts, 5)
    top_entities = top_items(entity_counts, 8)
    top_stances = top_items(stance_counts, 5)
    top_posts = representative_posts(posts, 5)
    headline_themes = [item["name"] for item in dominant_topics[:4]]
    recurring = [item["name"] for item in dominant_topics[1:4]]
    summary = {
        "month": month,
        "post_count": len(posts),
        "headline_themes": headline_themes,
        "dominant_topics": dominant_topics,
        "new_or_shifting_ideas": [],
        "recurring_concerns": recurring,
        "representative_posts": top_posts,
        "stance_changes": top_stances,
        "tone_profile": top_tones,
        "important_entities": top_entities,
        "external_context": [],
        "summary_narrative": f"{month}에는 {', '.join(headline_themes[:3]) or 'mixed topics'}가 중심이었다. 총 {len(posts)}개 포스트에서 {', '.join([t['name'] for t in top_tones[:2]]) or 'mixed'} 톤이 두드러졌고, 대표 포스트는 {top_posts[0]['title'] if top_posts else 'N/A'}였다."
    }
    return summary


def build_year_summary(year: str, posts):
    topic_counts = Counter()
    tone_counts = Counter()
    entity_counts = Counter()
    stance_counts = Counter()
    month_counts = Counter()
    for p in posts:
        topic_counts.update(p.get("primary_topics", []))
        tone_counts.update(p.get("tone", []))
        entity_counts.update([e["name"] for e in p.get("named_entities", [])])
        month_counts.update([p.get("archive_month")])
        for claim in p.get("key_claims", []):
            if claim.get("stance_target"):
                stance_counts.update([claim["stance_target"]])
    headline = [item["name"] for item in top_items(topic_counts, 5)]
    top_posts = representative_posts(posts, 8)
    return {
        "year": year,
        "post_count": len(posts),
        "headline_themes": headline,
        "topic_distribution": top_items(topic_counts, 8),
        "idea_evolution": [],
        "major_stance_arcs": top_items(stance_counts, 6),
        "important_entities": top_items(entity_counts, 12),
        "best_entry_points": top_posts[:5],
        "active_months": top_items(month_counts, 12),
        "tone_profile": top_items(tone_counts, 6),
        "summary_narrative": f"{year}년은 {', '.join(headline[:3]) or 'mixed themes'}를 중심으로 전개됐다. 총 {len(posts)}개 포스트가 있었고, 가장 자주 반복된 stance target은 {top_items(stance_counts,1)[0]['name'] if stance_counts else 'N/A'}였다."
    }


def main():
    posts = load_json(ENRICHED)
    by_month = defaultdict(list)
    by_year = defaultdict(list)
    for p in posts:
        by_month[p["archive_month"]].append(p)
        by_year[p["archive_month"][:4]].append(p)

    month_summaries = [build_month_summary(month, by_month[month]) for month in sorted(by_month)]
    year_summaries = [build_year_summary(year, by_year[year]) for year in sorted(by_year)]

    OUT_MONTHS.parent.mkdir(parents=True, exist_ok=True)
    OUT_MONTHS.write_text(json.dumps(month_summaries, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_YEARS.write_text(json.dumps(year_summaries, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"month_summaries={len(month_summaries)}")
    print(f"year_summaries={len(year_summaries)}")
    print(json.dumps(year_summaries[0], ensure_ascii=False, indent=2)[:1200])


if __name__ == "__main__":
    main()
