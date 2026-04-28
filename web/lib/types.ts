export type Claim = {
  claim: string;
  confidence: number | null;
  evidence_quotes: string[];
  stance_target: string | null;
  stance_polarity: string | null;
};

export type NamedEntity = {
  name: string;
  type: string;
  mentions: number;
};

export type Post = {
  post_id: number;
  url: string;
  title: string;
  published_at: string;
  archive_month: string;
  categories: string[];
  primary_topics: string[];
  secondary_topics: string[];
  summary_short: string;
  summary_long: string;
  key_claims: Claim[];
  named_entities: NamedEntity[];
  tone: string[];
  temporal_mode: string | null;
  comment_count: number;
  source_text: string;
  evidence_quotes?: string[];
};

export type CountItem = {
  name: string;
  count: number;
};

export type MonthSummary = {
  month: string;
  post_count: number;
  headline_themes: string[];
  dominant_topics: CountItem[];
  new_or_shifting_ideas: string[];
  recurring_concerns: string[];
  representative_posts: Pick<Post, 'post_id' | 'title' | 'url' | 'primary_topics'>[];
  stance_changes: CountItem[];
  tone_profile: CountItem[];
  important_entities: CountItem[];
};

export type YearSummary = {
  year: string;
  post_count: number;
  headline_themes: string[];
  topic_distribution: CountItem[];
  idea_evolution: string[];
  major_stance_arcs: CountItem[];
  important_entities: CountItem[];
};
