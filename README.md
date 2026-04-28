# Scott Aaronson Idea Atlas

Interactive knowledge product for Scott Aaronson's 2020-2026 blog corpus.

## Current status
- Raw crawl complete: **332 posts / 74 months / 0 failures**
- Semantic pipeline bootstrap complete
- Monthly summary bootstrap complete
- Yearly summary bootstrap complete

## Directory layout
- `data/posts_2020_2026.json` - raw crawled posts
- `data/derived/enriched_posts.json` - heuristic semantic enrichment
- `data/derived/month_summaries.json` - monthly rollups
- `data/derived/year_summaries.json` - yearly rollups
- `config/taxonomy_rules.json` - executable taxonomy + keyword rules
- `config/post_refinement_prompt_v1.md` - prompt template for LLM post refinement
- `config/refinement_schema_post_v1.json` - expected JSON output for refined post fields
- `scripts/enrich_posts.py` - post-level enrichment builder
- `scripts/build_summaries.py` - month/year summary builder
- `scripts/prepare_refinement_batches.py` - batch-prep for LLM refinement
- `scripts/validate_refinement_outputs.py` - structural validator for LLM outputs
- `scripts/merge_refinement_results.py` - merge refined post outputs back into derived JSON
- `docs/LLM_REFINEMENT_PIPELINE.md` - end-to-end refinement workflow notes
- `PLAN_2026-04-24.md` - product and execution plan
- `SEMANTIC_SCHEMA_DRAFT.json` - target post schema
- `SUMMARY_SCHEMA_DRAFT.md` - target summary schema

## Commands
```bash
python3 crawl_scott_aaronson.py
python3 scripts/enrich_posts.py
python3 scripts/build_summaries.py
python3 scripts/prepare_refinement_batches.py --months 202003,202004 --limit 10 --label march_april_sample
python3 scripts/validate_refinement_outputs.py data/derived/refinement_outputs/sample_refinements.jsonl
python3 scripts/merge_refinement_results.py data/derived/refinement_outputs/sample_refinements.jsonl --sample-only --output data/derived/refined_posts_sample.json
```

## Recommended next phase
1. tighten taxonomy rules and entity extraction
2. add LLM batch enrichment for summary/claims/stance quality
3. generate stronger month/year narratives
4. scaffold Next.js frontend using derived JSON artifacts
