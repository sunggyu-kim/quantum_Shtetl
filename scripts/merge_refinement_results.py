#!/usr/bin/env python3
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parent.parent
ENRICHED_DEFAULT = ROOT / "data" / "derived" / "enriched_posts.json"
OUT_DEFAULT = ROOT / "data" / "derived" / "enriched_posts_refined.json"
VALID_POLARITIES = {"support", "oppose", "skeptical", "conditional", None}


def load_records(path: Path):
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return []
    if path.suffix == ".jsonl":
        return [json.loads(line) for line in text.splitlines() if line.strip()]
    data = json.loads(text)
    return data if isinstance(data, list) else [data]


def normalize_result(record: Dict) -> Dict:
    if "refinement" in record and isinstance(record["refinement"], dict):
        refinement = {**record["refinement"]}
        refinement.setdefault("post_id", record.get("post_id"))
        return refinement
    return record


def validate(refinement: Dict) -> List[str]:
    errors = []
    if not isinstance(refinement.get("post_id"), int):
        errors.append("missing integer post_id")
    for field in ["summary_short", "summary_long"]:
        value = refinement.get(field)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"missing {field}")
    if not isinstance(refinement.get("evidence_quotes"), list) or len(refinement["evidence_quotes"]) < 2:
        errors.append("need at least 2 evidence_quotes")
    if not isinstance(refinement.get("key_claims"), list) or len(refinement["key_claims"]) < 2:
        errors.append("need at least 2 key_claims")
    else:
        for idx, claim in enumerate(refinement["key_claims"]):
            if not isinstance(claim.get("claim"), str) or not claim["claim"].strip():
                errors.append(f"claim {idx} missing text")
            if claim.get("stance_polarity") not in VALID_POLARITIES:
                errors.append(f"claim {idx} invalid stance_polarity")
            if not isinstance(claim.get("evidence_quotes"), list) or not claim["evidence_quotes"]:
                errors.append(f"claim {idx} missing evidence_quotes")
    return errors


def merge_post(post: Dict, refinement: Dict, source_label: str) -> Dict:
    merged = dict(post)
    baseline = {
        "summary_short": post.get("summary_short"),
        "summary_long": post.get("summary_long"),
        "key_claims": post.get("key_claims", []),
        "evidence_quotes": post.get("evidence_quotes", []),
    }
    merged["summary_short"] = refinement["summary_short"].strip()
    merged["summary_long"] = refinement["summary_long"].strip()
    merged["key_claims"] = refinement["key_claims"]
    merged["evidence_quotes"] = refinement["evidence_quotes"]
    merged["heuristic_baseline"] = baseline
    merged["refinement_meta"] = {
        "status": "llm_refined",
        "source_label": source_label,
        "schema_version": refinement.get("schema_version", "post_refinement_v1"),
        "prompt_version": refinement.get("prompt_version", "post_refinement_v1"),
        "merged_at": datetime.now(timezone.utc).isoformat(),
        "editor_notes": refinement.get("editor_notes", []),
        "stance_summary": refinement.get("stance_summary"),
    }
    return merged


def main():
    parser = argparse.ArgumentParser(description="Merge post refinement results into enriched posts")
    parser.add_argument("results", type=Path)
    parser.add_argument("--enriched", type=Path, default=ENRICHED_DEFAULT)
    parser.add_argument("--output", type=Path, default=OUT_DEFAULT)
    parser.add_argument("--sample-only", action="store_true", help="Write only the refined subset")
    parser.add_argument("--source-label", default="manual_or_llm_batch")
    args = parser.parse_args()

    posts = load_records(args.enriched)
    by_id = {post["post_id"]: post for post in posts}
    refinements = [normalize_result(record) for record in load_records(args.results)]

    failures = []
    for refinement in refinements:
        errors = validate(refinement)
        if errors:
            failures.append({"post_id": refinement.get("post_id"), "errors": errors})
    if failures:
        print(json.dumps({"ok": False, "failures": failures}, ensure_ascii=False, indent=2))
        raise SystemExit(1)

    merged_subset = []
    for refinement in refinements:
        post_id = refinement["post_id"]
        if post_id not in by_id:
            raise SystemExit(f"Refinement references unknown post_id={post_id}")
        merged_subset.append(merge_post(by_id[post_id], refinement, args.source_label))

    if args.sample_only:
        output_records = sorted(merged_subset, key=lambda item: item["published_at"])
    else:
        merged_by_id = {item["post_id"]: item for item in merged_subset}
        output_records = [merged_by_id.get(post["post_id"], post) for post in posts]

    output_path = args.output if args.output.is_absolute() else (ROOT / args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output_records, ensure_ascii=False, indent=2), encoding="utf-8")

    try:
        output_label = str(output_path.relative_to(ROOT))
    except ValueError:
        output_label = str(output_path)

    print(json.dumps({
        "ok": True,
        "refined_posts": len(merged_subset),
        "output": output_label
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
