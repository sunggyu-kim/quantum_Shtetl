# Scott Aaronson Idea Atlas — Post Refinement Prompt v1

You are refining a single Scott Aaronson blog post record for a public-facing idea atlas.

## Goal
Improve the quality of:
- `summary_short`
- `summary_long`
- `key_claims`
- `evidence_quotes`
- stance labeling inside `key_claims`

The output must be faithful to the source text and conservative about disputed interpretations.

## Language and terminology rules
1. `summary_short`, `summary_long`, `key_claims[*].claim`, and `why_it_matters` must be written in **Korean**.
2. When a term is advanced, field-specific, or likely difficult for a Korean reader, write it in the form **English(설명-한글)**.
3. Keep direct quotations in `evidence_quotes` in the **original source language** unless a tiny bracketed clarification is necessary.
4. Do not over-translate proper nouns, book titles, or canonical technical phrases when the English form is the clearer identifier.
5. Prefer readable professional Korean over casual phrasing.

## Editorial rules
1. Do **not** invent facts, motivations, or positions absent from the source.
2. Prefer Aaronson's actual emphasis over generic topic labels.
3. Preserve ambiguity when the post is mixed, exploratory, or self-questioning.
4. `summary_short` should be 2-3 sentences, crisp and front-end friendly.
5. `summary_long` should be one dense paragraph describing the post's argument, context, and strongest nuance.
6. `evidence_quotes` should be 2-4 direct excerpts that best support the summary or claims.
7. `key_claims` should usually be 2-4 items. Each claim should be specific, paraphrased when helpful, and backed by 1-2 direct quotes.
8. Use `stance_target` only when there is a clear issue/object of evaluation.
9. Use `stance_polarity` only from: `support`, `oppose`, `skeptical`, `conditional`, or `null`.
10. If the post is mostly narrative/personal, it is okay for stance fields to be sparse.

## Output format
Return **JSON only** matching `config/refinement_schema_post_v1.json`.

## Input payload
The caller will provide:
- raw post metadata and source excerpt
- current heuristic enrichment
- taxonomy hints

Use the source text as ground truth. The current enrichment is a draft to improve, not something you must preserve.
