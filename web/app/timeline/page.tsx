import Link from 'next/link';
import { PostLink, SectionCard, TooltipText, TopicPill } from '@/components/Cards';
import { formatDate, formatMonth, formatTopicName, getMonthSummaries, getPostsByYearAndTopic, getYearSummaries } from '@/lib/data';

export default async function TimelinePage({
  searchParams
}: {
  searchParams?: { year?: string; topic?: string };
}) {
  const selectedYear = typeof searchParams?.year === 'string' ? searchParams.year : undefined;
  const selectedTopic = typeof searchParams?.topic === 'string' ? searchParams.topic : undefined;
  const [months, years, selectedPosts] = await Promise.all([
    getMonthSummaries(),
    getYearSummaries(),
    getPostsByYearAndTopic(selectedYear, selectedTopic)
  ]);
  const maxYearCount = Math.max(...years.map((year) => year.post_count), 1);

  return (
    <div className="stackLg">
      <section className="timelineHero">
        <div>
          <p className="eyebrow">타임라인</p>
          <h2>연도별 글 수와 흥미 주제의 변화를 함께 봅니다.</h2>
        </div>
        <div className="yearChart">
          {years.map((year) => (
            <Link
              key={year.year}
              href={`/timeline?year=${year.year}`}
              className={`yearBarCard ${selectedYear === year.year ? 'isActive' : ''}`}
              title={`${year.year}: ${year.post_count}개 글`}
            >
              <span className="yearBarTrack">
                <span style={{ height: `${Math.max(16, (year.post_count / maxYearCount) * 100)}%` }} />
              </span>
              <strong>{year.year}</strong>
              <small>{year.post_count}</small>
            </Link>
          ))}
        </div>
      </section>

      <SectionCard title="연도별 흐름">
        <div className="yearGrid">
          {years.map((year) => (
            <article key={year.year} className="timelineCard">
              <div className="rowBetween">
                <Link href={`/timeline?year=${year.year}`} className="cardTitleLink">{year.year}</Link>
                <strong>{year.post_count}개 글</strong>
              </div>
              <p className="smallMuted lineClamp" title={year.headline_themes.map(formatTopicName).join(' · ')}>
                {year.headline_themes.map(formatTopicName).join(' · ')}
              </p>
              <div className="pillRow">
                {year.topic_distribution.slice(0, 4).map((topic) => (
                  <TopicPill
                    key={topic.name}
                    href={`/timeline?year=${year.year}&topic=${encodeURIComponent(topic.name)}`}
                    title={`${year.year} ${formatTopicName(topic.name)}: ${topic.count}개 글`}
                  >
                    {formatTopicName(topic.name)} · {topic.count}
                  </TopicPill>
                ))}
              </div>
              <div className="topicBars">
                {year.topic_distribution.slice(0, 5).map((topic) => (
                  <Link
                    key={`${year.year}-${topic.name}`}
                    href={`/timeline?year=${year.year}&topic=${encodeURIComponent(topic.name)}`}
                    className="topicTrendRow"
                    title={`${formatTopicName(topic.name)}: ${topic.count}`}
                  >
                    <TooltipText text={formatTopicName(topic.name)} className="truncateText" />
                    <span className="miniBar stretch"><span style={{ width: `${Math.max(14, topic.count * 4)}px` }} /></span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      {(selectedYear || selectedTopic) ? (
        <SectionCard
          title={[
            selectedYear ? `${selectedYear}년` : null,
            selectedTopic ? formatTopicName(selectedTopic) : null
          ].filter(Boolean).join(' · ')}
          action={<Link href="/timeline">전체 보기</Link>}
        >
          <div className="articleScroll">
            {selectedPosts.map((post) => (
              <article key={post.post_id} className="articleRow">
                <div>
                  <PostLink postId={post.post_id} title={post.title} />
                  <p className="smallMuted">{formatDate(post.published_at)}</p>
                </div>
                <p className="lineClamp" title={post.summary_short}>{post.summary_short}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="월별 타임라인">
        <div className="stackMd">
          {months.map((month) => (
            <article key={month.month} className="timelineCard">
              <div className="rowBetween wrapGap">
                <div>
                  <h3>{formatMonth(month.month)}</h3>
                  <p className="smallMuted">{month.post_count}개 글</p>
                </div>
                <div className="barGroup">
                  {month.dominant_topics.slice(0, 4).map((topic) => (
                    <div key={topic.name} className="barRow">
                      <TooltipText text={formatTopicName(topic.name)} className="truncateText" />
                      <div className="miniBar"><span style={{ width: `${Math.max(18, topic.count * 18)}px` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="lineClamp" title={month.headline_themes.map(formatTopicName).join(' · ')}>
                {month.headline_themes.map(formatTopicName).join(' · ')}
              </p>
              <div className="pillRow">
                {month.representative_posts.map((post) => (
                  <TopicPill key={post.post_id} href={`/posts/${post.post_id}`} title={post.title}>
                    {post.title}
                  </TopicPill>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
