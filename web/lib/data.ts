import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type { MonthSummary, Post, YearSummary } from '@/lib/types';

const bundledDataRoot = path.join(process.cwd(), 'data');
const repoDataRoot = path.join(process.cwd(), '..', 'data');
const dataRoot = existsSync(bundledDataRoot) ? bundledDataRoot : repoDataRoot;
const dataPath = (...parts: string[]) => path.join(dataRoot, ...parts);

const topicCategoryOrder = [
  'AI & Intelligence',
  'Science Policy & Institutions',
  'Quantum Computing',
  'Civilization & Existential Risk'
];

const topicCategoryMap: Record<string, string> = {
  'AI & Intelligence': 'AI & Intelligence',
  'Philosophy & Metaphysics': 'AI & Intelligence',
  'Science Policy & Institutions': 'Science Policy & Institutions',
  'Politics & Society': 'Science Policy & Institutions',
  'Personal / Community / Meta': 'Science Policy & Institutions',
  'Quantum Computing': 'Quantum Computing',
  'Complexity Theory': 'Quantum Computing',
  'Physics Foundations': 'Quantum Computing',
  'Civilization & Existential Risk': 'Civilization & Existential Risk'
};

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

export function postMatchesTopic(post: Post, topic: string) {
  return [...post.primary_topics, ...post.secondary_topics].includes(topic);
}

export function formatTopicName(value: string) {
  const labels: Record<string, string> = {
    'Personal / Community / Meta': '개인 / 커뮤니티 / 메타',
    'Science Policy & Institutions': '과학 정책과 제도',
    'Physics Foundations': '물리학 기초',
    'Politics & Society': '정치와 사회',
    'Philosophy & Metaphysics': '철학과 Metaphysics',
    'Civilization & Existential Risk': '문명과 Existential Risk'
  };
  return labels[value] ?? value;
}

export function formatStanceTarget(value: string) {
  const labels: Record<string, string> = {
    'useful quantum computing timeline': '유용한 Quantum Computing 전망',
    'academic culture': '학계 문화',
    'free speech / discourse norms': '표현의 자유 / 담론 규범',
    'political tribalism': '정치적 진영주의',
    'Israel / antisemitism / geopolitics': '이스라엘 / 반유대주의 / 지정학',
    'AI existential risk': 'AI Existential Risk',
    'AGI feasibility': 'AGI 실현 가능성',
    'US science funding': '미국 과학 연구비',
    'human specialness': '인간 고유성',
    'simulation hypothesis': 'Simulation Hypothesis'
  };
  return labels[value] ?? value;
}

export async function getPostsByTopic(topic: string) {
  const posts = await getPosts();
  return posts.filter((post) => postMatchesTopic(post, topic));
}

export async function getPostsByYearAndTopic(year?: string, topic?: string) {
  const posts = await getPosts();
  return posts.filter((post) => {
    const postYear = new Date(post.published_at).getFullYear().toString();
    const yearMatches = year ? postYear === year : true;
    const topicMatches = topic ? postMatchesTopic(post, topic) : true;
    return yearMatches && topicMatches;
  });
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

  const categoryTotals = new Map<string, number>();
  const categories = new Map<string, Array<{
    name: string;
    count: number;
    size: number;
    x: number;
    y: number;
    related: Array<{ name: string; count: number }>;
  }>>();

  for (const category of topicCategoryOrder) {
    categories.set(category, []);
    categoryTotals.set(category, 0);
  }

  const maxCount = Math.max(...topTopics.map((topic) => topic.count), 1);
  topTopics.forEach((topic) => {
    const category = topicCategoryMap[topic.name] ?? 'Science Policy & Institutions';
    const current = categories.get(category) ?? [];
    const localIndex = current.length;
    const point = {
      ...topic,
      size: Math.round(74 + (topic.count / maxCount) * 82),
      x: [24, 66, 42, 78, 18][localIndex % 5],
      y: [28, 38, 68, 72, 56][localIndex % 5],
      related: [...connections.entries()]
        .filter(([key]) => key.split(':::').includes(topic.name))
        .map(([key, count]) => ({
          name: key.split(':::').find((value) => value !== topic.name) ?? topic.name,
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
    };
    current.push(point);
    categories.set(category, current);
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + topic.count);
  });

  return topicCategoryOrder.map((name) => ({
    name,
    total: categoryTotals.get(name) ?? 0,
    topics: categories.get(name) ?? []
  }));
}

export async function getStanceExplorerData() {
  const posts = await getPosts();
  const groups = new Map<string, {
    name: string;
    count: number;
    polarities: Map<string, number>;
    posts: Array<{ post_id: number; title: string; polarity: string | null; quote: string }>;
    seenPostIds: Set<number>;
  }>();

  for (const post of posts) {
    for (const claim of post.key_claims) {
      if (!claim.stance_target) continue;
      const group = groups.get(claim.stance_target) ?? {
        name: claim.stance_target,
        count: 0,
        polarities: new Map<string, number>(),
        posts: [],
        seenPostIds: new Set<number>()
      };
      group.count += 1;
      group.polarities.set(claim.stance_polarity ?? 'unlabeled', (group.polarities.get(claim.stance_polarity ?? 'unlabeled') ?? 0) + 1);
      if (!group.seenPostIds.has(post.post_id)) {
        group.posts.push({
          post_id: post.post_id,
          title: post.title,
          polarity: claim.stance_polarity,
          quote: claim.evidence_quotes[0] ?? claim.claim
        });
        group.seenPostIds.add(post.post_id);
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
    support: '지지',
    oppose: '반대',
    skeptical: '회의적',
    conditional: '조건부',
    unlabeled: '미분류'
  };
  if (!value) return '미분류';
  return labels[value] ?? value;
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
