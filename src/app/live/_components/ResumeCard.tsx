'use client';

import { useState } from 'react';
import { VoteButton } from './VoteButton';
import { InitialAvatar } from './InitialAvatar';

interface ResumeReview {
  id: string;
  created_at: string;
  author_name: string | null;
  title: string;
  context: string | null;
  resume_url: string;
  resume_filename: string;
  status: 'pending' | 'reviewed';
  review_notes: string | null;
  reviewed_at: string | null;
  vote_count: number;
  hasVoted: boolean;
}

interface Props {
  review: ResumeReview;
  onVoteChange: (id: string, newCount: number, hasVoted: boolean) => void;
}

export function ResumeCard({ review, onVoteChange }: Props) {
  const [voting, setVoting] = useState(false);

  const handleVote = async () => {
    if (voting) return;
    setVoting(true);

    const method = review.hasVoted ? 'DELETE' : 'POST';
    const res = await fetch(`/api/resume-review/${review.id}/vote`, { method });

    if (res.ok) {
      const data = await res.json();
      onVoteChange(review.id, data.vote_count, !review.hasVoted);
    }
    setVoting(false);
  };

  const displayName = review.author_name ?? 'Anonymous';

  return (
    <div
      className={`group rounded-2xl border bg-surface-workbench/60 p-5 transition-all duration-300 hover:border-border-interactive hover:bg-surface-workbench ${
        review.status === 'reviewed' ? 'border-emerald-500/20' : 'border-border-subtle'
      }`}
    >
      <div className="flex items-start gap-4">
        <VoteButton
          count={review.vote_count}
          hasVoted={review.hasVoted}
          voting={voting}
          onVote={handleVote}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <InitialAvatar name={displayName} />
            <span className="text-sm font-medium text-text-secondary">{displayName}</span>
            {review.status === 'reviewed' && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Reviewed
              </span>
            )}
          </div>

          <p className="mt-2 font-medium text-text-primary">{review.title}</p>

          {review.context && (
            <p className="mt-1 text-sm text-text-secondary leading-relaxed">{review.context}</p>
          )}

          <a
            href={review.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-interactive hover:text-foreground"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h8M8 2v9m0 0L5 8m3 3 3-3" />
            </svg>
            {review.resume_filename}
          </a>

          {review.review_notes && (
            <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1">Review Notes</p>
              <p className="text-sm text-text-secondary leading-relaxed">{review.review_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
