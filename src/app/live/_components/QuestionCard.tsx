'use client';

import { useState } from 'react';
import { VoteButton } from './VoteButton';
import { InitialAvatar } from './InitialAvatar';

interface AmaQuestion {
  id: string;
  created_at: string;
  author_name: string | null;
  question: string;
  status: 'unanswered' | 'answered';
  answer: string | null;
  answered_at: string | null;
  vote_count: number;
  hasVoted: boolean;
}

interface Props {
  question: AmaQuestion;
  onVoteChange: (id: string, newCount: number, hasVoted: boolean) => void;
}

export function QuestionCard({ question, onVoteChange }: Props) {
  const [voting, setVoting] = useState(false);

  const handleVote = async () => {
    if (voting) return;
    setVoting(true);

    const method = question.hasVoted ? 'DELETE' : 'POST';
    const res = await fetch(`/api/ama/${question.id}/vote`, { method });

    if (res.ok) {
      const data = await res.json();
      onVoteChange(question.id, data.vote_count, !question.hasVoted);
    }
    setVoting(false);
  };

  const displayName = question.author_name ?? 'Anonymous';

  return (
    <div
      className={`group rounded-2xl border bg-surface-workbench/60 p-5 transition-all duration-300 hover:border-border-interactive hover:bg-surface-workbench ${
        question.status === 'answered' ? 'border-emerald-500/20' : 'border-border-subtle'
      }`}
    >
      <div className="flex items-start gap-4">
        <VoteButton
          count={question.vote_count}
          hasVoted={question.hasVoted}
          voting={voting}
          onVote={handleVote}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <InitialAvatar name={displayName} />
            <span className="text-sm font-medium text-text-secondary sensitive">{displayName}</span>
            {question.status === 'answered' && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Answered
              </span>
            )}
          </div>

          <p className="mt-2 text-text-primary leading-relaxed">{question.question}</p>

          {question.answer && (
            <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1">Answer</p>
              <p className="text-sm text-text-secondary leading-relaxed">{question.answer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
