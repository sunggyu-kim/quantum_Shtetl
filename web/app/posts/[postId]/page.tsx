import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PostLink, SectionCard, TopicPill } from '@/components/Cards';
import { formatDate, formatPolarity, getPostById, getPosts } from '@/lib/data';

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ postId: String(post.post_id) }));
}

export default async function PostPage({ params }: { params: { postId: string } }) {
  const post = await getPostById(Number(params.postId));
  if (!post) notFound();

  return (
    <div className="stackLg">
      <section className="card stackMd">
        <div className="stackSm">
          <p className="eyebrow">포스트 상세</p>
          <h2>{post.title}</h2>
          <div className="rowBetween wrapGap">
            <p className="smallMuted">{formatDate(post.published_at)} · 댓글 {post.comment_count}개</p>
            <a href={post.url} target="_blank" rel="noreferrer" className="buttonSecondary">원문 열기</a>
          </div>
        </div>
        <p className="lede">{post.summary_long || post.summary_short}</p>
        <div className="pillRow">
          {post.primary_topics.map((topic) => (
            <TopicPill key={topic}>{topic}</TopicPill>
          ))}
        </div>
      </section>

      <div className="twoColDetail">
        <SectionCard title="핵심 주장">
          <div className="stackMd">
            {post.key_claims.map((claim, index) => (
              <article key={`${post.post_id}-${index}`} className="sampleCard">
                <p>{claim.claim}</p>
                <div className="pillRow">
                  {claim.stance_target ? <TopicPill>{claim.stance_target}</TopicPill> : null}
                  {claim.stance_polarity ? <TopicPill>{formatPolarity(claim.stance_polarity)}</TopicPill> : null}
                  {claim.confidence ? <TopicPill>confidence(신뢰도) {claim.confidence}</TopicPill> : null}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="엔티티와 톤">
          <div className="stackMd">
            <div>
              <p className="muted">엔티티</p>
              <div className="pillRow">
                {post.named_entities.slice(0, 15).map((entity) => (
                  <span key={`${entity.name}-${entity.type}`} className="entityChip">
                    {entity.name} <strong>{entity.mentions}</strong>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="muted">톤</p>
              <div className="pillRow">
                {post.tone.map((tone) => (
                  <TopicPill key={tone}>{tone}</TopicPill>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="원문 발췌">
        <p className="sourceBlock">{post.source_text.slice(0, 4000)}{post.source_text.length > 4000 ? '…' : ''}</p>
      </SectionCard>

      <SectionCard title="추가 메타데이터">
        <div className="stackSm">
          <p><strong>아카이브 월:</strong> {post.archive_month}</p>
          <p><strong>카테고리:</strong> {post.categories.join(', ') || '—'}</p>
          <p><strong>보조 주제:</strong> {post.secondary_topics.join(', ') || '—'}</p>
          <p><strong>시간 모드:</strong> {post.temporal_mode || '—'}</p>
          <p><strong>다른 포스트로 이동:</strong> <PostLink postId={post.post_id} title="네비게이션으로 돌아가기" /></p>
        </div>
      </SectionCard>
    </div>
  );
}
