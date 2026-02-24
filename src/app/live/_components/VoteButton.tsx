'use client';

interface Props {
  count: number;
  hasVoted: boolean;
  voting: boolean;
  onVote: () => void;
}

export function VoteButton({ count, hasVoted, voting, onVote }: Props) {
  return (
    <button
      type="button"
      onClick={onVote}
      disabled={voting}
      aria-label={hasVoted ? 'Remove vote' : 'Upvote'}
      className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2.5 py-2 transition-all duration-200 ${
        hasVoted
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          : 'border-border-subtle text-text-muted hover:border-border-interactive hover:text-foreground'
      } ${voting ? 'opacity-50' : ''}`}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 16 16"
        fill={hasVoted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3L2 10h3v3h6v-3h3L8 3z" />
      </svg>
      <span className="text-xs font-semibold tabular-nums leading-none">{count}</span>
    </button>
  );
}
