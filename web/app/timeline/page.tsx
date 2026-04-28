import { SectionCard, TopicPill } from '@/components/Cards';
import { formatMonth, getMonthSummaries, getYearSummaries } from '@/lib/data';

export default async function TimelinePage() {
  const [months, years] = await Promise.all([getMonthSummaries(), getYearSummaries()]);

  return (
    <div className="stackLg">
      <SectionCard title="연도별 흐름">
        <div className="yearGrid">
          {years.map((year) => (
            <article key={year.year} className="timelineCard">
              <div className="rowBetween">
                <h3>{year.year}</h3>
                <strong>{year.post_count}개 포스트</strong>
              </div>
              <p className="smallMuted">{year.headline_themes.join(' · ')}</p>
              <div className="pillRow">
                {year.topic_distribution.slice(0, 4).map((topic) => (
                  <TopicPill key={topic.name}>{topic.name} ({topic.count})</TopicPill>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="월별 타임라인">
        <div className="stackMd">
          {months.map((month) => (
            <article key={month.month} className="timelineCard">
              <div className="rowBetween wrapGap">
                <div>
                  <h3>{formatMonth(month.month)}</h3>
                  <p className="smallMuted">{month.post_count}개 포스트</p>
                </div>
                <div className="barGroup">
                  {month.dominant_topics.slice(0, 4).map((topic) => (
                    <div key={topic.name} className="barRow">
                      <span>{topic.name}</span>
                      <div className="miniBar"><span style={{ width: `${Math.max(18, topic.count * 18)}px` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <p>{month.headline_themes.join(' · ')}</p>
              <div className="pillRow">
                {month.representative_posts.map((post) => (
                  <TopicPill key={post.post_id}>{post.title}</TopicPill>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
