import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type { MonthSummary, Post, YearSummary } from '@/lib/types';

const dataPath = (...parts: string[]) => path.join(process.cwd(), '..', 'data', ...parts);

const readJson = cache(async <T>(filePath: string): Promise<T> => {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
});

export const getPosts = cache(async () => {
  const refinedPath = dataPath('derived', 'enriched_posts_refined.json');
  const sourcePath = existsSync(refinedPath)
    ? refinedPath
    : dataPath('derived', 'enriched_posts.json');
  const posts = await readJson<Post[]>(sourcePath);
  return posts.sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at));
});

export const getMonthSummaries = cache(async () => {
  return readJson<MonthSummary[]>(dataPath('derived', 'month_summaries.json'));
});

export const getYearSummaries = cache(async () => {
  return readJson<YearSummary[]>(dataPath('derived', 'year_summaries.json'));
});

export async function getPostById(postId: number) {
  const posts = await getPosts();
  return posts.find((post) => post.post_id === postId) ?? null;
}

export async function getDashboardData() {
  const [posts, months, years] = await Promise.all([
    getPosts(),
    getMonthSummaries(),
    getYearSummaries()
  ]);

  const topicCounts = new Map<string, number>();
  const stanceCounts = new Map<string, number>();
  const entityCounts = new Map<string, number>();

  for (const post of posts) {
    for (const topic of post.primary_topics) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }

    for (const entity of post.named_entities.slice(0, 8)) {
      entityCounts.set(entity.name, (entityCounts.get(entity.name) ?? 0) + entity.mentions);
    }

    for (const claim of post.key_claims) {
      if (!claim.stance_target) continue;
      stanceCounts.set(claim.stance_target, (stanceCounts.get(claim.stance_target) ?? 0) + 1);
    }
  }

  return {
    posts,
    months,
    years,
    topTopics: [...topicCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    topStances: [...stanceCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    topEntities: [...entityCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    latestPosts: posts.slice(0, 6)
  };
}

export async function getTopicMapData() {
  const posts = await getPosts();
  const topicCounts = new Map<string, number>();
  const connections = new Map<string, number>();

  for (const post of posts) {
    const topics = [...new Set([...post.primary_topics, ...post.secondary_topics])];
    for (const topic of post.primary_topics) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
    for (let i = 0; i < topics.length; i += 1) {
      for (let j = i + 1; j < topics.length; j += 1) {
        const key = [topics[i], topics[j]].sort().join(':::');
        connections.set(key, (connections.get(key) ?? 0) + 1);
      }
    }
  }

  const topTopics = [...topicCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 9);

  return topTopics.map((topic) => ({
    ...topic,
    related: [...connections.entries()]
      .filter(([key]) => key.includes(topic.name))
      .map(([key, count]) => ({
        name: key.split(':::').find((value) => value !== topic.name) ?? topic.name,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
  }));
}

export async function getStanceExplorerData() {
  const posts = await getPosts();
  const groups = new Map<string, {
    name: string;
    count: number;
    polarities: Map<string, number>;
    posts: Array<{ post_id: number; title: string; polarity: string | null; quote: string }>;
  }>();

  for (const post of posts) {
    for (const claim of post.key_claims) {
      if (!claim.stance_target) continue;
      const group = groups.get(claim.stance_target) ?? {
        name: claim.stance_target,
        count: 0,
        polarities: new Map<string, number>(),
        posts: []
      };
      group.count += 1;
      group.polarities.set(claim.stance_polarity ?? 'unlabeled', (group.polarities.get(claim.stance_polarity ?? 'unlabeled') ?? 0) + 1);
      if (group.posts.length < 6) {
        group.posts.push({
          post_id: post.post_id,
          title: post.title,
          polarity: claim.stance_polarity,
          quote: claim.evidence_quotes[0] ?? claim.claim
        });
      }
      groups.set(claim.stance_target, group);
    }
  }

  return [...groups.values()]
    .map((group) => ({
      name: group.name,
      count: group.count,
      polarities: [...group.polarities.entries()].map(([name, count]) => ({ name, count })),
      posts: group.posts
    }))
    .sort((a, b) => b.count - a.count);
}

export function formatPolarity(value: string | null) {
  const labels: Record<string, string> = {
    support: 'support(지지)',
    oppose: 'oppose(반대)',
    skeptical: 'skeptical(회의적)',
    conditional: 'conditional(조건부)'
  };
  if (!value) return 'unlabeled(미분류)';
  return labels[value] ?? `${value}(설명-한글 필요)`;
}

export function formatMonth(month: string) {
  const year = month.slice(0, 4);
  const monthNum = month.slice(4, 6);
  return new Date(`${year}-${monthNum}-01T00:00:00`).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long'
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
