import Link from 'next/link';
import { PostLink, SectionCard, TooltipText, TopicPill } from '@/components/Cards';
import { formatDate, formatTopicName, getPostsByTopic, getTopicMapData } from '@/lib/data';

export default async function TopicsPage({
  searchParams
}: {
  searchParams?: { topic?: string };
}) {
  const selectedTopic = typeof searchParams?.topic === 'string' ? searchParams.topic : undefined;
  const [categories, selectedPosts] = await Promise.all([
    getTopicMapData(),
    selectedTopic ? getPostsByTopic(selectedTopic) : Promise.resolve([])
  ]);

  return (
    <div className="stackLg">
      <section className="topicHero">
        <div>
          <p className="eyebrow">주제 맵</p>
          <h2>네 개의 큰 분류 안에서 주제의 크기와 연결을 봅니다.</h2>
        </div>
        <div className="topicHeroStats">
          {categories.map((category) => (
            <span key={category.name} className="categoryStat">
              <span>{category.name}</span>
              <strong>{category.total}</strong>
            </span>
          ))}
        </div>
      </section>

      <div className="clusterGrid">
        {categories.map((category) => (
          <section key={category.name} className="clusterPanel">
            <div className="rowBetween">
              <h3>{category.name}</h3>
              <strong>{category.total}</strong>
            </div>
            <div className="scatterPlane">
              {category.topics.map((topic) => (
                <Link
                  key={`${category.name}-${topic.name}`}
                  href={`/topics?topic=${encodeURIComponent(topic.name)}`}
                  className={`scatterBubble ${selectedTopic === topic.name ? 'isActive' : ''}`}
                  style={{
                    width: `${topic.size}px`,
                    height: `${topic.size}px`,
                    left: `${topic.x}%`,
                    top: `${topic.y}%`
                  }}
                  title={`${formatTopicName(topic.name)}: ${topic.count}개 글`}
                >
                  <TooltipText text={formatTopicName(topic.name)} className="bubbleText" />
                  <strong>{topic.count}</strong>
                </Link>
              ))}
            </div>
            <div className="relationList">
              {category.topics.map((topic) => (
                <div key={`${topic.name}-relations`} className="relationBlock">
                  <TopicPill href={`/topics?topic=${encodeURIComponent(topic.name)}`} title={formatTopicName(topic.name)}>
                    {formatTopicName(topic.name)}
                  </TopicPill>
                  <div className="pillRow">
                    {topic.related.slice(0, 3).map((related) => (
                      <TopicPill
                        key={`${topic.name}-${related.name}`}
                        href={`/topics?topic=${encodeURIComponent(related.name)}`}
                        title={formatTopicName(related.name)}
                        className="subtlePill"
                      >
                        {formatTopicName(related.name)} · {related.count}
                      </TopicPill>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {selectedTopic ? (
        <SectionCard title={`${formatTopicName(selectedTopic)} 관련 글`} action={<Link href="/topics">전체 맵</Link>}>
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
            {selectedPosts.length === 0 ? <p className="smallMuted">연결된 글이 없습니다.</p> : null}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
