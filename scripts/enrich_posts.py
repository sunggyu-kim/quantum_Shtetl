#!/usr/bin/env python3
import json
import re
from collections import Counter
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parent.parent
RAW_POSTS = ROOT / "data" / "posts_2020_2026.json"
RULES_PATH = ROOT / "config" / "taxonomy_rules.json"
OUT_PATH = ROOT / "data" / "derived" / "enriched_posts.json"

SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"'\(])")
STOPWORDS = {
    "the", "and", "that", "with", "this", "from", "have", "about", "would", "there", "their", "which",
    "because", "while", "where", "when", "what", "your", "into", "just", "than", "then", "they", "them",
    "were", "been", "being", "also", "here", "more", "such", "much", "very", "some", "like", "really",
    "could", "should", "these", "those", "over", "under", "after", "before", "through", "between", "only",
    "still", "even", "does", "don't", "can't", "it's", "i'm", "we're", "he's", "she's", "it's", "itself"
}


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def split_sentences(text: str) -> List[str]:
    text = re.sub(r"\s+", " ", text or "").strip()
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"\(])", text)
    return [p.strip() for p in parts if len(p.strip()) > 30]


def text_blob(post: Dict) -> str:
    chunks = [post.get("title", ""), " ".join(post.get("categories", [])), post.get("content_text", "")]
    return normalize_whitespace(" ".join(chunks)).lower()


def score_topics(post: Dict, rules: Dict) -> Counter:
    scores = Counter()
    cats = post.get("categories", [])
    blob = text_blob(post)
    for cat in cats:
        for topic in rules["category_to_topics"].get(cat, []):
            scores[topic] += 3
    for topic, keywords in rules["keyword_rules"].items():
        for kw in keywords:
            if kw in blob:
                scores[topic] += 1
    return scores


def choose_topics(scores: Counter, order: List[str]) -> Tuple[List[str], List[str]]:
    ordered = sorted(scores.items(), key=lambda kv: (-kv[1], order.index(kv[0]) if kv[0] in order else 999))
    primary = [topic for topic, score in ordered if score > 0][:3]
    secondary = [topic for topic, score in ordered if score > 0 and topic not in primary][:5]
    if not primary:
        primary = ["Personal / Community / Meta"]
    return primary, secondary


def detect_tones(post: Dict, rules: Dict) -> List[str]:
    blob = text_blob(post)
    tones = []
    for tone, keywords in rules["tone_rules"].items():
        if any(kw in blob for kw in keywords):
            tones.append(tone)
    title = (post.get("title") or "").lower()
    if any(x in title for x in ["happy", "congrat", "good news"]):
        tones.append("celebratory")
    if any(x in title for x in ["we've lost", "memorial", "tribute", "rest in peace"]):
        tones.append("elegiac")
    if not tones:
        tones.append("explanatory")
    return sorted(set(tones))


def detect_temporal_mode(post: Dict) -> str:
    title = (post.get("title") or "").lower()
    text = (post.get("content_text") or "").lower()
    if any(k in title for k in ["review", "looking back", "letter to", "birthday"]) or "looking back" in text:
        return "retrospective"
    if any(k in title for k in ["future", "will", "coming", "wanted", "next", "forecast"]):
        return "forward_looking"
    if any(k in title for k in ["statement", "response", "letter", "on being", "before we start"]) or any(
        k in text for k in ["today", "yesterday", "this week", "breaking", "news"]
    ):
        return "reactive"
    return "evergreen"


def sentence_score(sentence: str, primary_topics: List[str], rules: Dict) -> int:
    s = sentence.lower()
    score = min(len(sentence) // 80, 4)
    for topic in primary_topics:
        for kw in rules["keyword_rules"].get(topic, []):
            if kw in s:
                score += 2
    score += sum(1 for x in [" i think ", " i argue ", " the point ", " should ", " must ", " risk ", " future "] if x in f" {s} ")
    return score


def summarize(post: Dict, primary_topics: List[str], rules: Dict) -> Tuple[str, str, List[str]]:
    sentences = split_sentences(post.get("content_text", ""))
    if not sentences:
        return "", "", []
    ranked = sorted(sentences, key=lambda s: (-sentence_score(s, primary_topics, rules), len(s)))
    top = ranked[:5]
    evidence = top[:3]
    summary_short = " ".join(sentences[:2])[:700].strip()
    summary_long = " ".join(top[:3])[:1800].strip()
    return summary_short, summary_long, evidence


def infer_stance_target(text: str, rules: Dict) -> str:
    blob = text.lower()
    best_target = None
    best_hits = 0
    for target, keywords in rules["stance_targets"].items():
        hits = sum(1 for kw in keywords if kw in blob)
        if hits > best_hits:
            best_hits = hits
            best_target = target
    return best_target


def infer_stance_polarity(sentence: str) -> str:
    s = sentence.lower()
    if any(k in s for k in ["i support", "good news", "important", "should", "need to", "must"]):
        return "support"
    if any(k in s for k in ["wrong", "bad idea", "dangerous", "oppose", "shouldn't", "nonsense"]):
        return "oppose"
    if any(k in s for k in ["skeptical", "i doubt", "not convinced", "unclear"]):
        return "skeptical"
    if any(k in s for k in ["if", "unless", "depends", "conditional"]):
        return "conditional"
    return None


def extract_claims(evidence_quotes: List[str], rules: Dict) -> List[Dict]:
    claims = []
    for quote in evidence_quotes[:3]:
        claims.append({
            "claim": quote[:300],
            "confidence": 0.45,
            "evidence_quotes": [quote[:400]],
            "stance_target": infer_stance_target(quote, rules),
            "stance_polarity": infer_stance_polarity(quote),
        })
    return claims


def extract_entities(post: Dict) -> List[Dict]:
    text = f"{post.get('title','')} {post.get('content_text','')}"
    candidates = re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][A-Za-z0-9\.-]+){0,3})\b", text)
    counts = Counter()
    for c in candidates:
        c = normalize_whitespace(c)
        if len(c) < 3 or c.lower() in STOPWORDS:
            continue
        if c in {"Scott", "Aaronson", "Quantum", "Computing", "The", "And", "But"}:
            continue
        counts[c] += 1
    entities = []
    for name, count in counts.most_common(10):
        typ = "concept"
        if any(word in name for word in ["University", "Institute", "Google", "OpenAI", "MIT", "CSAIL"]):
            typ = "organization"
        elif any(word in name for word in ["America", "China", "Israel", "Gaza", "US", "Russia", "Ukraine"]):
            typ = "country"
        elif len(name.split()) >= 2:
            typ = "person"
        entities.append({"name": name, "type": typ, "mentions": count})
    return entities


def enrich_post(post: Dict, rules: Dict) -> Dict:
    topic_scores = score_topics(post, rules)
    primary_topics, secondary_topics = choose_topics(topic_scores, rules["topic_order"])
    summary_short, summary_long, evidence_quotes = summarize(post, primary_topics, rules)
    enriched = {
        "post_id": post["id"],
        "url": post["url"],
        "title": post["title"],
        "published_at": post.get("published_iso"),
        "archive_month": post.get("archive_month"),
        "categories": post.get("categories", []),
        "primary_topics": primary_topics,
        "secondary_topics": secondary_topics,
        "summary_short": summary_short,
        "summary_long": summary_long,
        "key_claims": extract_claims(evidence_quotes, rules),
        "named_entities": extract_entities(post),
        "tone": detect_tones(post, rules),
        "temporal_mode": detect_temporal_mode(post),
        "comment_count": post.get("comment_count"),
        "source_text": post.get("content_text", ""),
        "evidence_quotes": evidence_quotes,
        "topic_scores": dict(topic_scores),
    }
    return enriched


def main():
    posts = load_json(RAW_POSTS)
    rules = load_json(RULES_PATH)
    enriched = [enrich_post(post, rules) for post in posts]
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    print(f"enriched_posts={len(enriched)}")
    sample = enriched[0]
    print(json.dumps({
        "post_id": sample["post_id"],
        "title": sample["title"],
        "primary_topics": sample["primary_topics"],
        "tone": sample["tone"],
        "temporal_mode": sample["temporal_mode"]
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
