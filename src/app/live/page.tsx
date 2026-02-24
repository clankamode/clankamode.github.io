import type { Metadata } from 'next';
import { LiveBoard } from './_components/LiveBoard';

export const metadata: Metadata = {
  title: 'Live | James Peralta',
  description: 'Ask questions and submit resumes for review. Upvote the ones you want answered most.',
};

export default function LivePage() {
  return (
    <main className="min-h-[calc(100vh-var(--nav-height,113px))] bg-background pb-24 pt-28">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-text-muted">Community</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary">Live</h1>
          <p className="mt-3 text-text-secondary">
            Ask questions, submit your resume for review, and vote for the ones you want addressed most.
          </p>
        </div>
        <LiveBoard />
      </div>
    </main>
  );
}
