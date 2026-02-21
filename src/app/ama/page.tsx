import type { Metadata } from 'next';
import { AmaBoard } from './_components/AmaBoard';

export const metadata: Metadata = {
  title: 'Ask Me Anything | James Peralta',
  description: 'Ask James a question. Upvote the ones you want answered most.',
};

export default function AmaPage() {
  return (
    <main className="min-h-[calc(100vh-var(--nav-height,113px))] bg-background pb-24 pt-28">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-text-muted">Community</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary">Ask Me Anything</h1>
          <p className="mt-3 text-text-secondary">
            Ask a question and vote for the ones you want answered most. Questions rise and fall in real time.
          </p>
        </div>
        <AmaBoard />
      </div>
    </main>
  );
}
