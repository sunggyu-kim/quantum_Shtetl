import Link from 'next/link';
import type { ReactNode } from 'react';

const nav = [
  { href: '/', label: 'Dashboard' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/topics', label: 'Topic Map' },
  { href: '/stances', label: 'Stances' }
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Scott Aaronson Idea Atlas</p>
          <h1>Interactive map of 2020–2026 blog ideas</h1>
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
