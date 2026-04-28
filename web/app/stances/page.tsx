import { PostLink, SectionCard, TopicPill } from '@/components/Cards';
import { formatPolarity, getStanceExplorerData } from '@/lib/data';

export default async function StancesPage() {
  const stances = await getStanceExplorerData();

  return (
    <div className="stackLg">
      <SectionCard title="입장 탐색기">
        <p className="lede">
          휴리스틱 claim extraction(주장 추출) 결과를 stance target(입장 대상) 기준으로 묶고, 가장 빈도가 높은 polarity(극성)와 예시 근거를 보여줍니다.
        </p>
        <div className="stackMd">
          {stances.map((stance) => (
            <article key={stance.name} className="stanceCard">
              <div className="rowBetween wrapGap">
                <div>
                  <h3>{stance.name}</h3>
                  <p className="smallMuted">{stance.count}개 추출 주장</p>
                </div>
                <div className="pillRow">
                  {stance.polarities.map((polarity) => (
                    <TopicPill key={polarity.name}>{formatPolarity(polarity.name)} ({polarity.count})</TopicPill>
                  ))}
                </div>
              </div>
              <div className="sampleGrid">
                {stance.posts.map((post) => (
                  <article key={`${stance.name}-${post.post_id}-${post.quote.slice(0, 20)}`} className="sampleCard">
                    <PostLink postId={post.post_id} title={post.title} />
                    <p className="smallMuted">{formatPolarity(post.polarity)}</p>
                    <blockquote>{post.quote}</blockquote>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
