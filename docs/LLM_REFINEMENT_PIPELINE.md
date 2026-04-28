# LLM Refinement Pipeline

This project already has a rule-based enrichment pass (`scripts/enrich_posts.py`). This document adds the next stage: a lightweight, auditable LLM refinement workflow for higher-quality summaries, claims, stance labels, and quote selection.

## What was added
- `config/post_refinement_prompt_v1.md` — editorial instructions for one-post refinement
- `config/refinement_schema_post_v1.json` — expected JSON output shape
- `scripts/prepare_refinement_batches.py` — builds vendor-neutral JSONL prompt batches from raw + enriched inputs
- `scripts/validate_refinement_outputs.py` — validates JSON/JSONL outputs before merge
- `scripts/merge_refinement_results.py` — merges refined outputs into enriched post records while preserving heuristic baselines

## Recommended workflow

### 1) Prepare a batch
```bash
python3 scripts/prepare_refinement_batches.py \
  --months 202003,202004 \
  --limit 10 \
  --label march_april_sample
```

This writes:
- `data/derived/refinement_batches/post_refinement_batch_<label>.jsonl`
- `data/derived/refinement_batches/post_refinement_batch_<label>_preview.json`

Each JSONL row contains:
- `post_id`
- prompt text
- compact raw metadata
- current heuristic enrichment snapshot
- taxonomy hints

## 2) Run an LLM externally
Use the `prompt` field from each row and ask the model to return JSON matching `config/refinement_schema_post_v1.json`.

Provider notes:
- Keep one post per completion; it is easier to retry and audit.
- Start with smaller month-scoped batches.
- Preserve `post_id`, `prompt_version`, and `schema_version` in the response.

## 3) Validate outputs
```bash
python3 scripts/validate_refinement_outputs.py data/derived/refinement_outputs/sample_refinements.jsonl
```

## 4) Merge into website-ready JSON
Full corpus replacement:
```bash
python3 scripts/merge_refinement_results.py \
  data/derived/refinement_outputs/sample_refinements.jsonl \
  --output data/derived/enriched_posts_refined.json
```

Subset / demo artifact only:
```bash
python3 scripts/merge_refinement_results.py \
  data/derived/refinement_outputs/sample_refinements.jsonl \
  --sample-only \
  --output data/derived/refined_posts_sample.json
```

## Merge behavior
The merge script overwrites these top-level fields in refined records:
- `summary_short`
- `summary_long`
- `key_claims`
- `evidence_quotes`

It also preserves the prior heuristic outputs under:
- `heuristic_baseline`
- `refinement_meta`

## Suggested next production step
1. Run month-by-month batches, starting with 2023-2026 high-interest posts.
2. Spot-check 10-20 outputs before bulk merge.
3. Add a second refinement pass for month/year narratives after enough refined posts exist.

## Current known limits
- Quote spans are plain text excerpts, not source offsets.
- The validator is structural; it does not verify semantic faithfulness.
- Full-corpus processing still needs a chosen model/provider and cost/runtime budget.
