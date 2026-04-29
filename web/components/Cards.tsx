import Link from 'next/link';
import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  detail,
  href
}: {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="muted">{label}</p>
      <h3>{value}</h3>
      {detail ? <p className="smallMuted">{detail}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="card statCard interactiveCard">
        {content}
      </Link>
    );
  }

  return (
    <article className="card statCard">
      {content}
    </article>
  );
}

export function SectionCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TopicPill({
  children,
  href,
  title,
  className = ''
}: {
  children: ReactNode;
  href?: string;
  title?: string;
  className?: string;
}) {
  const pillClass = `pill ${className}`.trim();
  if (href) {
    return (
      <Link href={href} className={pillClass} title={title}>
        {children}
      </Link>
    );
  }

  return <span className={pillClass} title={title}>{children}</span>;
}

export function PostLink({ postId, title }: { postId: number; title: string }) {
  return (
    <Link href={`/posts/${postId}`} className="postLink" title={title}>
      {title}
    </Link>
  );
}

export function TooltipText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className} title={text}>
      {text}
    </span>
  );
}
