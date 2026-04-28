import Link from 'next/link';
import type { ReactNode } from 'react';

export function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <article className="card statCard">
      <p className="muted">{label}</p>
      <h3>{value}</h3>
      {detail ? <p className="smallMuted">{detail}</p> : null}
    </article>
  );
}

export function SectionCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card sectionCard">
      <div className="sectionHeader">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TopicPill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}

export function PostLink({ postId, title }: { postId: number; title: string }) {
  return (
    <Link href={`/posts/${postId}`} className="postLink">
      {title}
    </Link>
  );
}
