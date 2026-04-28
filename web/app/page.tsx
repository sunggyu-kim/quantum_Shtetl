import Link from 'next/link';
import { PostLink, SectionCard, StatCard, TopicPill } from '@/components/Cards';
import { getDashboardData, formatDate } from '@/lib/data';

export default async function HomePage() {
  const data = await getDashboardData();
  const firstYear = data.years[0]?.year;
  const lastYear = data.years.at(-1)?.year;

  return (
    <div className="stackLg">
      <section className="hero card">
        <div>
          <p className="eyebrow">대시보드</p>
          <h2>반복되는 논점, 주제, 정서 변화를 추적하는 소형 아틀라스입니다.</h2>
          <p className="lede">
            로컬에서 생성한 JSON 아티팩트 기반으로 구성되어, 이식성과 재생성 용이성을 유지합니다.
          </p>
        </div>
        <div className="heroActions">
          <Link href="/timeline" className="buttonPrimary">타임라인 보기</Link>
          <Link href="/stances" className="buttonSecondary">입장 흐름 보기</Link>
        </div>
      </section>

      <section className="statsGrid">
        <StatCard label="포스트 수" value={data.posts.length} detail={`${firstYear} → ${lastYear}`} />
        <StatCard label="월별 롤업" value={data.months.length} detail="서사적 시간 구간" />
        <StatCard label="연도별 롤업" value={data.years.length} detail="장기 주제 흐름" />
        <StatCard label="추적 입장 대상" value={data.topStances.length} detail="반복 논쟁 상위 항목" />
      </section>

      <div className="twoCol">
        <SectionCard title="상위 핵심 주제" action={<Link href="/topics">맵 보기</Link>}>
          <div className="listGrid">
            {data.topTopics.map((topic) => (
              <div key={topic.name} className="rowBetween compactRow">
                <TopicPill>{topic.name}</TopicPill>
                <strong>{topic.count}</strong>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="주요 입장 대상" action={<Link href="/stances">탐색기 열기</Link>}>
          <div className="listGrid">
            {data.topStances.map((stance) => (
              <div key={stance.name} className="rowBetween compactRow">
                <span>{stance.name}</span>
                <strong>{stance.count}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="twoCol">
        <SectionCard title="최근 포스트">
          <div className="stackMd">
            {data.latestPosts.map((post) => (
              <article key={post.post_id} className="postPreview">
                <div className="rowBetween">
                  <PostLink postId={post.post_id} title={post.title} />
                  <span className="smallMuted">{formatDate(post.published_at)}</span>
                </div>
                <p>{post.summary_short}</p>
                <div className="pillRow">
                  {post.primary_topics.slice(0, 3).map((topic) => (
                    <TopicPill key={topic}>{topic}</TopicPill>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="고신호 엔티티">
          <div className="pillRow">
            {data.topEntities.map((entity) => (
              <span key={entity.name} className="entityChip">
                {entity.name} <strong>{entity.count}</strong>
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
