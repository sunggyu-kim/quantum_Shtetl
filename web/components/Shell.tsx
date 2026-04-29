import Link from 'next/link';
import type { ReactNode } from 'react';

const nav = [
  { href: '/', label: '대시보드' },
  { href: '/timeline', label: '타임라인' },
  { href: '/topics', label: '주제 맵' },
  { href: '/stances', label: '입장 흐름' }
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brandBlock">
          <p className="eyebrow">Scott Aaronson Idea Atlas</p>
          <h1>2020-2026 블로그 아이디어 지도</h1>
        </div>
        <nav>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="navLink">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
