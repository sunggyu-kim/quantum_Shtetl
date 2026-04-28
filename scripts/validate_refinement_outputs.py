#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from typing import Dict, List

VALID_POLARITIES = {"support", "oppose", "skeptical", "conditional", None}


def load_records(path: Path) -> List[Dict]:
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return []
    if path.suffix == ".jsonl":
        return [json.loads(line) for line in text.splitlines() if line.strip()]
    data = json.loads(text)
    return data if isinstance(data, list) else [data]


def normalize(record: Dict) -> Dict:
    if "refinement" in record and isinstance(record["refinement"], dict):
        merged = {**record["refinement"]}
        merged.setdefault("post_id", record.get("post_id"))
        return merged
    return record


def validate_record(record: Dict) -> List[str]:
    errors: List[str] = []
    post_id = record.get("post_id")
    if not isinstance(post_id, int):
        errors.append("post_id must be an integer")
    for field in ["summary_short", "summary_long"]:
        if not isinstance(record.get(field), str) or not record[field].strip():
            errors.append(f"{field} must be a non-empty string")
    evidence_quotes = record.get("evidence_quotes")
    if not isinstance(evidence_quotes, list) or len(evidence_quotes) < 2:
        errors.append("evidence_quotes must contain at least 2 strings")
    else:
        for quote in evidence_quotes:
            if not isinstance(quote, str) or not quote.strip():
                errors.append("evidence_quotes must contain only non-empty strings")
                break
    key_claims = record.get("key_claims")
    if not isinstance(key_claims, list) or len(key_claims) < 2:
        errors.append("key_claims must contain at least 2 claim objects")
    else:
        for idx, claim in enumerate(key_claims):
            if not isinstance(claim, dict):
                errors.append(f"key_claims[{idx}] must be an object")
                continue
            if not isinstance(claim.get("claim"), str) or not claim["claim"].strip():
                errors.append(f"key_claims[{idx}].claim must be a non-empty string")
            confidence = claim.get("confidence")
            if not isinstance(confidence, (int, float)) or not (0 <= float(confidence) <= 1):
                errors.append(f"key_claims[{idx}].confidence must be between 0 and 1")
            stance_polarity = claim.get("stance_polarity")
            if stance_polarity not in VALID_POLARITIES:
                errors.append(f"key_claims[{idx}].stance_polarity is invalid: {stance_polarity}")
            claim_quotes = claim.get("evidence_quotes")
            if not isinstance(claim_quotes, list) or not claim_quotes:
                errors.append(f"key_claims[{idx}].evidence_quotes must be a non-empty array")
    return errors


def main():
    parser = argparse.ArgumentParser(description="Validate post refinement outputs")
    parser.add_argument("path", type=Path)
    args = parser.parse_args()

    records = [normalize(record) for record in load_records(args.path)]
    if not records:
        raise SystemExit("No records found")

    failures = []
    for record in records:
        errors = validate_record(record)
        if errors:
            failures.append({"post_id": record.get("post_id"), "errors": errors})

    if failures:
        print(json.dumps({"ok": False, "failures": failures}, ensure_ascii=False, indent=2))
        raise SystemExit(1)

    print(json.dumps({"ok": True, "records": len(records)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
