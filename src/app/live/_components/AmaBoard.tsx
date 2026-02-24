'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole, hasRole } from '@/types/roles';
import { SubmitQuestion } from './SubmitQuestion';
import { QuestionCard } from './QuestionCard';

const POLL_INTERVAL_ADMIN = 10_000;
const POLL_INTERVAL_DEFAULT = 45_000;

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

export function AmaBoard() {
  const { data: session } = useSession();
  const isAdmin = hasRole((session?.user?.role as UserRole) || UserRole.USER, UserRole.ADMIN);
  const pollInterval = isAdmin ? POLL_INTERVAL_ADMIN : POLL_INTERVAL_DEFAULT;

  const [questions, setQuestions] = useState<AmaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unanswered' | 'answered'>('unanswered');

  const fetchQuestions = useCallback(async () => {
    const res = await fetch('/api/ama');
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startPolling = () => {
      pollRef.current = setInterval(fetchQuestions, pollInterval);
    };

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchQuestions();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchQuestions, pollInterval]);

  const handleNewQuestion = (question: AmaQuestion) => {
    setQuestions((prev) => [question, ...prev]);
  };

  const handleVoteChange = (id: string, newCount: number, hasVoted: boolean) => {
    setQuestions((prev) => {
      const updated = prev.map((q) => (q.id === id ? { ...q, vote_count: newCount, hasVoted } : q));
      return [...updated].sort((a, b) => b.vote_count - a.vote_count || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  };

  const filtered = statusFilter === 'all' ? questions : questions.filter((q) => q.status === statusFilter);

  return (
    <div className="space-y-6">
      <SubmitQuestion onSubmit={handleNewQuestion} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {filtered.length} {filtered.length === 1 ? 'question' : 'questions'}
        </p>
        <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface-interactive/40 p-1">
          {(['all', 'unanswered', 'answered'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-surface-dense text-foreground'
                  : 'text-text-muted hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-border-subtle bg-surface-workbench/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-workbench/40 px-6 py-12 text-center">
          <p className="text-text-secondary">No questions yet. Be the first to ask.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestionCard key={q.id} question={q} onVoteChange={handleVoteChange} />
          ))}
        </div>
      )}
    </div>
  );
}
