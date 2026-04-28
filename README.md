# Scott Aaronson Idea Atlas

A structured research dataset and lightweight web app for exploring Scott Aaronson's blog corpus from **2020 to 2026**.

This repository turns the raw archive into a navigable idea map with:
- **332 posts** across **74 archive months**
- post-level summaries, claims, stance labels, and evidence quotes
- month-level and year-level rollups
- a small **Next.js** frontend for browsing timeline, topics, stances, and individual posts

## What this repo contains

### Core datasets
- `data/posts_2020_2026.json` — raw crawled blog posts
- `data/derived/enriched_posts.json` — heuristic enrichment pass
- `data/derived/enriched_posts_refined.json` — full refined post dataset (**332 / 332 complete**)
- `data/derived/month_summaries.json` — monthly synthesis
- `data/derived/year_summaries.json` — yearly synthesis
- `data/derived/refinement_outputs/all_refinements_current_332.jsonl` — consolidated refinement output log

### Config and schemas
- `config/taxonomy_rules.json` — topic taxonomy and keyword rules
- `config/post_refinement_prompt_v1.md` — editorial prompt for post refinement
- `config/refinement_schema_post_v1.json` — expected refinement schema
- `SEMANTIC_SCHEMA_DRAFT.json` / `SUMMARY_SCHEMA_DRAFT.md` — schema drafts

### Pipeline scripts
- `crawl_scott_aaronson.py` — archive crawl
- `scripts/enrich_posts.py` — heuristic enrichment
- `scripts/build_summaries.py` — monthly/yearly summary generation
- `scripts/validate_refinement_outputs.py` — refinement validator
- `scripts/merge_refinement_results.py` — merge refined outputs into website-ready JSON

### Web app
- `web/` — Next.js app for browsing the corpus

## Current status

- Raw crawl: **complete**
- Heuristic enrichment: **complete**
- Monthly summaries: **complete**
- Yearly summaries: **complete**
- LLM refinement: **complete for all 332 posts**
- Public GitHub cleanup: **trimmed to final/relevant artifacts**

## Why this project exists

Scott Aaronson's blog is not just a sequence of posts; it is a long-running record of ideas about:
- quantum computing
- complexity theory
- physics foundations
- AI and existential risk
- academic culture and public discourse
- politics, civilization, and philosophical questions

The goal of this project is to make that evolving intellectual landscape easier to inspect, summarize, and analyze.

## Quick start

### Data pipeline
```bash
python3 crawl_scott_aaronson.py
python3 scripts/enrich_posts.py
python3 scripts/build_summaries.py
python3 scripts/validate_refinement_outputs.py data/derived/refinement_outputs/all_refinements_current_332.jsonl
python3 scripts/merge_refinement_results.py data/derived/refinement_outputs/all_refinements_current_332.jsonl --output data/derived/enriched_posts_refined.json
```

### Web app
```bash
cd web
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Front-page summary

**Scott Aaronson Idea Atlas** is a cleaned, structured, and searchable map of Aaronson's 2020-2026 writing.
It combines raw posts, semantic enrichment, full-post refinement, and web exploration into a single public research artifact.

## Notes

- This repo keeps the **final useful outputs** and removes most bulky intermediate batch artifacts.
- The web app prefers `data/derived/enriched_posts_refined.json` when present.
- The refinement layer is designed to be auditable: summaries and claims are backed by source quotes.
