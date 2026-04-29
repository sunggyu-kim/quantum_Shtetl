import Link from 'next/link';
import { PostLink, SectionCard, TooltipText, TopicPill } from '@/components/Cards';
import { formatPolarity, formatStanceTarget, getStanceExplorerData } from '@/lib/data';

export default async function StancesPage({
  searchParams
}: {
  searchParams?: { stance?: string };
}) {
  const selectedStance = typeof searchParams?.stance === 'string' ? searchParams.stance : undefined;
  const stances = await getStanceExplorerData();
  const visibleStances = selectedStance
    ? stances.filter((stance) => stance.name === selectedStance)
    : stances;

  return (
    <div className="stackLg">
      <section className="stanceHero">
        <div>
          <p className="eyebrow">입장 흐름</p>
          <h2>반복되는 논쟁 대상을 묶고, 관련 글 전체를 확인합니다.</h2>
        </div>
        <div className="stanceRibbon">
          {stances.slice(0, 10).map((stance) => (
            <TopicPill
              key={stance.name}
              href={`/stances?stance=${encodeURIComponent(stance.name)}`}
              title={`${formatStanceTarget(stance.name)}: ${stance.count}개 주장`}
              className={selectedStance === stance.name ? 'activePill' : ''}
            >
              {formatStanceTarget(stance.name)} · {stance.count}
            </TopicPill>
          ))}
        </div>
      </section>

      {selectedStance ? (
        <div className="rowBetween wrapGap">
          <p className="smallMuted">{formatStanceTarget(selectedStance)} 기준으로 좁혀 본 결과입니다.</p>
          <Link href="/stances" className="buttonSecondary">전체 입장</Link>
        </div>
      ) : null}

      <SectionCard title="입장별 글 목록">
        <div className="stackMd">
          {visibleStances.map((stance) => (
            <article key={stance.name} className="stanceCard">
              <div className="rowBetween wrapGap">
                <div>
                  <h3>{formatStanceTarget(stance.name)}</h3>
                  <p className="smallMuted">{stance.count}개 주장 · {stance.posts.length}개 글</p>
                </div>
                <div className="pillRow">
                  {stance.polarities.map((polarity) => (
                    <TopicPill key={polarity.name} title={`${formatPolarity(polarity.name)} ${polarity.count}`}>
                      {formatPolarity(polarity.name)} · {polarity.count}
                    </TopicPill>
                  ))}
                </div>
              </div>
              <div className="sampleGrid articleScroll">
                {stance.posts.map((post) => (
                  <article key={`${stance.name}-${post.post_id}`} className="sampleCard">
                    <PostLink postId={post.post_id} title={post.title} />
                    <p className="smallMuted">{formatPolarity(post.polarity)}</p>
                    <blockquote className="lineClamp" title={post.quote}>
                      <TooltipText text={post.quote} />
                    </blockquote>
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
