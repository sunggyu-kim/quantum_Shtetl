import Link from 'next/link';
import type { CSSProperties } from 'react';
import { PostLink, SectionCard, StatCard, TooltipText, TopicPill } from '@/components/Cards';
import { formatDate, formatStanceTarget, formatTopicName, getDashboardData } from '@/lib/data';

export default async function HomePage() {
  const data = await getDashboardData();
  const firstYear = data.years[0]?.year;
  const lastYear = data.years.at(-1)?.year;
  const maxTopicCount = Math.max(...data.topTopics.map((topic) => topic.count), 1);
  const maxEntityCount = Math.max(...data.topEntities.map((entity) => entity.count), 1);

  return (
    <div className="stackLg">
      <section className="heroPanel">
        <div className="dateBadge">
          <strong>{data.posts.length}</strong>
          <span>글</span>
        </div>
        <div className="heroCopy">
          <p className="eyebrow">대시보드</p>
          <h2>논점, 주제, 입장의 흐름을 한 화면에서 보는 아이디어 지도</h2>
          <p className="lede">
            Scott Aaronson의 2020-2026 글을 주제, 시기, 입장 단위로 묶어 탐색합니다.
          </p>
        </div>
        <div className="heroSignal">
          <span>주요 범위</span>
          <strong>{firstYear} - {lastYear}</strong>
        </div>
        <div className="heroActions">
          <Link href="/timeline" className="buttonPrimary">타임라인</Link>
          <Link href="/topics" className="buttonSecondary">주제 맵</Link>
          <Link href="/stances" className="buttonSecondary">입장 흐름</Link>
        </div>
      </section>

      <section className="statsGrid">
        <StatCard href="/timeline" label="글 수" value={data.posts.length} detail={`${firstYear} - ${lastYear}`} />
        <StatCard href="/timeline" label="월별 구간" value={data.months.length} detail="시간 흐름" />
        <StatCard href="/topics" label="핵심 주제" value={data.topTopics.length} detail="상위 분류" />
        <StatCard href="/stances" label="입장 대상" value={data.topStances.length} detail="반복 논쟁" />
      </section>

      <div className="dashboardGrid">
        <SectionCard title="상위 핵심 주제" action={<Link href="/topics">맵 보기</Link>}>
          <div className="topicMetricGrid">
            {data.topTopics.map((topic) => (
              <Link
                key={topic.name}
                href={`/topics?topic=${encodeURIComponent(topic.name)}`}
                className="topicMetric interactiveCard"
                title={`${formatTopicName(topic.name)}: ${topic.count}개 글`}
              >
                <span className="metricRing" style={{ '--metric': `${Math.max(16, (topic.count / maxTopicCount) * 100)}%` } as CSSProperties}>
                  <strong>{topic.count}</strong>
                </span>
                <TooltipText text={formatTopicName(topic.name)} className="metricLabel" />
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="주요 입장 대상" action={<Link href="/stances">탐색기 열기</Link>}>
          <div className="listGrid">
            {data.topStances.map((stance) => (
              <Link
                key={stance.name}
                href={`/stances?stance=${encodeURIComponent(stance.name)}`}
                className="rowBetween compactRow interactiveCard"
                title={`${formatStanceTarget(stance.name)}: ${stance.count}개 주장`}
              >
                <TooltipText text={formatStanceTarget(stance.name)} className="truncateText" />
                <strong>{stance.count}</strong>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="dashboardGrid lower">
        <SectionCard title="최근 글">
          <div className="stackMd">
            {data.latestPosts.map((post) => (
              <article key={post.post_id} className="postPreview">
                <div className="rowBetween">
                  <PostLink postId={post.post_id} title={post.title} />
                  <span className="smallMuted">{formatDate(post.published_at)}</span>
                </div>
                <p className="lineClamp" title={post.summary_short}>{post.summary_short}</p>
                <div className="pillRow">
                  {post.primary_topics.slice(0, 3).map((topic) => (
                    <TopicPill key={topic} href={`/topics?topic=${encodeURIComponent(topic)}`} title={formatTopicName(topic)}>
                      {formatTopicName(topic)}
                    </TopicPill>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="고신호 엔티티">
          <div className="entityMiniGrid">
            {data.topEntities.map((entity) => (
              <span
                key={entity.name}
                className="entityDot"
                style={{ '--entity-size': `${38 + (entity.count / maxEntityCount) * 54}px` } as CSSProperties}
                title={`${entity.name}: ${entity.count}`}
              >
                <TooltipText text={entity.name} className="entityName" />
                <strong>{entity.count}</strong>
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
