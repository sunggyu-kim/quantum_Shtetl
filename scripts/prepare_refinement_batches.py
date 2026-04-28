#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from string import Template
from typing import Dict, Iterable, List

ROOT = Path(__file__).resolve().parent.parent
RAW_DEFAULT = ROOT / "data" / "posts_2020_2026.json"
ENRICHED_DEFAULT = ROOT / "data" / "derived" / "enriched_posts.json"
RULES_DEFAULT = ROOT / "config" / "taxonomy_rules.json"
PROMPT_DEFAULT = ROOT / "config" / "post_refinement_prompt_v1.md"
SCHEMA_DEFAULT = ROOT / "config" / "refinement_schema_post_v1.json"
OUT_DIR_DEFAULT = ROOT / "data" / "derived" / "refinement_batches"

PROMPT_WRAPPER = Template(
    """${instructions}

POST_ID: ${post_id}
TITLE: ${title}
URL: ${url}
PUBLISHED_AT: ${published_at}
ARCHIVE_MONTH: ${archive_month}
CATEGORIES: ${categories}
PRIMARY_TOPICS_DRAFT: ${primary_topics}
SECONDARY_TOPICS_DRAFT: ${secondary_topics}
TONE_DRAFT: ${tone}
TEMPORAL_MODE_DRAFT: ${temporal_mode}

CURRENT_HEURISTIC_ENRICHMENT:
${current_enrichment}

TAXONOMY_HINTS:
${taxonomy_hints}

SOURCE_EXCERPT:
${source_excerpt}
"""
)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def parse_csv(value: str | None) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def select_posts(posts: List[Dict], months: Iterable[str], post_ids: Iterable[int], limit: int | None) -> List[Dict]:
    month_set = set(months)
    id_set = set(post_ids)
    filtered = []
    for post in posts:
        if month_set and post.get("archive_month") not in month_set:
            continue
        if id_set and post.get("id") not in id_set:
            continue
        filtered.append(post)
    if limit is not None:
        filtered = filtered[:limit]
    return filtered


def compact(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)


def truncate_source(text: str, max_chars: int) -> str:
    text = (text or "").strip()
    if len(text) <= max_chars:
        return text
    head = int(max_chars * 0.7)
    tail = max_chars - head - 64
    return text[:head].rstrip() + "\n\n[... source excerpt truncated ...]\n\n" + text[-tail:].lstrip()


def build_record(post: Dict, enriched: Dict, rules: Dict, instructions: str, max_source_chars: int) -> Dict:
    heuristic_snapshot = {
        "summary_short": enriched.get("summary_short"),
        "summary_long": enriched.get("summary_long"),
        "key_claims": enriched.get("key_claims", []),
        "evidence_quotes": enriched.get("evidence_quotes", []),
        "named_entities": enriched.get("named_entities", [])[:8],
    }
    taxonomy_hints = {
        "topic_order": rules.get("topic_order", []),
        "stance_targets": sorted(rules.get("stance_targets", {}).keys()),
        "tone_labels": sorted(rules.get("tone_rules", {}).keys()),
    }
    prompt = PROMPT_WRAPPER.substitute(
        instructions=instructions.strip(),
        post_id=post["id"],
        title=post.get("title", ""),
        url=post.get("url", ""),
        published_at=post.get("published_iso"),
        archive_month=post.get("archive_month"),
        categories=", ".join(post.get("categories", [])),
        primary_topics=", ".join(enriched.get("primary_topics", [])),
        secondary_topics=", ".join(enriched.get("secondary_topics", [])),
        tone=", ".join(enriched.get("tone", [])),
        temporal_mode=enriched.get("temporal_mode"),
        current_enrichment=compact(heuristic_snapshot),
        taxonomy_hints=compact(taxonomy_hints),
        source_excerpt=truncate_source(post.get("content_text", ""), max_source_chars),
    )
    return {
        "custom_id": f"post-{post['id']}",
        "post_id": post["id"],
        "archive_month": post.get("archive_month"),
        "title": post.get("title"),
        "prompt_version": "post_refinement_v1",
        "schema_path": str(SCHEMA_DEFAULT.relative_to(ROOT)),
        "prompt": prompt,
        "input": {
            "raw_post": {
                "id": post["id"],
                "url": post.get("url"),
                "title": post.get("title"),
                "published_at": post.get("published_iso"),
                "archive_month": post.get("archive_month"),
                "categories": post.get("categories", []),
                "comment_count": post.get("comment_count"),
                "source_excerpt": truncate_source(post.get("content_text", ""), max_source_chars),
            },
            "heuristic_enrichment": heuristic_snapshot,
            "taxonomy_hints": taxonomy_hints,
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Prepare vendor-neutral LLM refinement batches")
    parser.add_argument("--raw", type=Path, default=RAW_DEFAULT)
    parser.add_argument("--enriched", type=Path, default=ENRICHED_DEFAULT)
    parser.add_argument("--rules", type=Path, default=RULES_DEFAULT)
    parser.add_argument("--prompt-template", type=Path, default=PROMPT_DEFAULT)
    parser.add_argument("--months", help="Comma-separated YYYYMM values")
    parser.add_argument("--post-ids", help="Comma-separated post ids")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--max-source-chars", type=int, default=12000)
    parser.add_argument("--label", default="sample")
    args = parser.parse_args()

    raw_posts = load_json(args.raw)
    enriched_posts = {item["post_id"]: item for item in load_json(args.enriched)}
    rules = load_json(args.rules)
    instructions = args.prompt_template.read_text(encoding="utf-8")

    selected = select_posts(
        raw_posts,
        parse_csv(args.months),
        [int(x) for x in parse_csv(args.post_ids)],
        args.limit,
    )
    if not selected:
        raise SystemExit("No posts matched the requested filters.")

    records = [build_record(post, enriched_posts[post["id"]], rules, instructions, args.max_source_chars) for post in selected]

    OUT_DIR_DEFAULT.mkdir(parents=True, exist_ok=True)
    batch_path = OUT_DIR_DEFAULT / f"post_refinement_batch_{args.label}.jsonl"
    preview_path = OUT_DIR_DEFAULT / f"post_refinement_batch_{args.label}_preview.json"

    with batch_path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    preview = {
        "label": args.label,
        "post_count": len(records),
        "post_ids": [record["post_id"] for record in records],
        "months": sorted({record["archive_month"] for record in records}),
        "batch_path": str(batch_path.relative_to(ROOT)),
        "schema_path": str(SCHEMA_DEFAULT.relative_to(ROOT)),
        "prompt_template": str(args.prompt_template.relative_to(ROOT)),
    }
    preview_path.write_text(json.dumps(preview, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(preview, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
