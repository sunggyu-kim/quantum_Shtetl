import { SectionCard, TopicPill } from '@/components/Cards';
import { getTopicMapData } from '@/lib/data';

export default async function TopicsPage() {
  const topics = await getTopicMapData();

  return (
    <div className="stackLg">
      <SectionCard title="주제 맵">
        <p className="lede">
          경량 공기출현(co-occurrence, 동시출현) 뷰입니다. 각 카드는 지배적 주제와 함께 자주 등장하는 인접 아이디어를 보여줍니다.
        </p>
        <div className="topicGrid">
          {topics.map((topic) => (
            <article key={topic.name} className="topicCard">
              <div className="rowBetween">
                <h3>{topic.name}</h3>
                <strong>{topic.count}</strong>
              </div>
              <div className="stackSm">
                {topic.related.map((related) => (
                  <div key={related.name} className="relationRow">
                    <span>{related.name}</span>
                    <div className="miniBar stretch"><span style={{ width: `${Math.max(14, related.count * 4)}px` }} /></div>
                    <strong>{related.count}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="읽는 법">
        <div className="pillRow">
          <TopicPill>Primary topics(핵심 주제)가 카드 순위를 결정</TopicPill>
          <TopicPill>Secondary topics(보조 주제)도 연결 강도에 반영</TopicPill>
          <TopicPill>반복되는 교차영역 결합을 포착하는 데 유용</TopicPill>
        </div>
      </SectionCard>
    </div>
  );
}
