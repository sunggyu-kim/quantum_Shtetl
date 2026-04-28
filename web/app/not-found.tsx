import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card stackMd">
      <p className="eyebrow">Not found</p>
      <h2>That post isn’t in the atlas.</h2>
      <p className="lede">Try the dashboard or timeline to jump back into the corpus.</p>
      <div>
        <Link href="/" className="buttonPrimary">Return home</Link>
      </div>
    </div>
  );
}
