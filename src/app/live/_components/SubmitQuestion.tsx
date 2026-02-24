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
  onSubmit: (question: AmaQuestion) => void;
}

const MAX_CHARS = 500;

export function SubmitQuestion({ onSubmit }: Props) {
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charsLeft = MAX_CHARS - text.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/ama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text.trim(), anonymous }),
    });

    if (res.ok) {
      const data = await res.json();
      onSubmit(data.question);
      setText('');
      setAnonymous(false);
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to submit. Try again.');
    }

    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-5 transition-colors focus-within:border-border-interactive"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What do you want to ask?"
        rows={3}
        maxLength={MAX_CHARS}
        className="w-full resize-none bg-transparent text-text-primary placeholder-text-muted outline-none text-sm leading-relaxed"
      />

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle bg-surface-interactive accent-emerald-500"
            />
            Ask anonymously
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs tabular-nums ${charsLeft < 50 ? 'text-amber-400' : 'text-text-muted'}`}>
            {charsLeft}
          </span>
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Ask'}
          </button>
        </div>
      </div>
    </form>
  );
}
