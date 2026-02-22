'use client';

import { useState } from 'react';

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

function InitialAvatar({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  const colors = [
    'bg-emerald-500/20 text-emerald-400',
    'bg-blue-500/20 text-blue-400',
    'bg-purple-500/20 text-purple-400',
    'bg-amber-500/20 text-amber-400',
    'bg-rose-500/20 text-rose-400',
  ];
  const color = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
      {letter}
    </div>
  );
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
        <button
          type="button"
          onClick={handleVote}
          disabled={voting}
          aria-label={question.hasVoted ? 'Remove vote' : 'Upvote question'}
          className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2.5 py-2 transition-all duration-200 ${
            question.hasVoted
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-border-subtle text-text-muted hover:border-border-interactive hover:text-foreground'
          } ${voting ? 'opacity-50' : ''}`}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill={question.hasVoted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 3L2 10h3v3h6v-3h3L8 3z" />
          </svg>
          <span className="text-xs font-semibold tabular-nums leading-none">{question.vote_count}</span>
        </button>

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
