'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole, hasRole } from '@/types/roles';
import { SubmitResume } from './SubmitResume';
import { ResumeCard } from './ResumeCard';

const POLL_INTERVAL_ADMIN = 10_000;
const POLL_INTERVAL_DEFAULT = 45_000;

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

export function ResumeBoard() {
  const { data: session } = useSession();
  const isAdmin = hasRole((session?.user?.role as UserRole) || UserRole.USER, UserRole.ADMIN);
  const pollInterval = isAdmin ? POLL_INTERVAL_ADMIN : POLL_INTERVAL_DEFAULT;

  const [reviews, setReviews] = useState<ResumeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

  const fetchReviews = useCallback(async () => {
    const res = await fetch('/api/resume-review');
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startPolling = () => {
      pollRef.current = setInterval(fetchReviews, pollInterval);
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
        fetchReviews();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchReviews, pollInterval]);

  const handleNewReview = (review: ResumeReview) => {
    setReviews((prev) => [review, ...prev]);
  };

  const handleVoteChange = (id: string, newCount: number, hasVoted: boolean) => {
    setReviews((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, vote_count: newCount, hasVoted } : r));
      return [...updated].sort((a, b) => b.vote_count - a.vote_count || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  };

  const filtered = statusFilter === 'all' ? reviews : reviews.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-6">
      <SubmitResume onSubmit={handleNewReview} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {filtered.length} {filtered.length === 1 ? 'resume' : 'resumes'}
        </p>
        <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface-interactive/40 p-1">
          {(['all', 'pending', 'reviewed'] as const).map((s) => (
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
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border-subtle bg-surface-workbench/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-workbench/40 px-6 py-12 text-center">
          <p className="text-text-secondary">No resumes submitted yet. Be the first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ResumeCard key={r.id} review={r} onVoteChange={handleVoteChange} />
          ))}
        </div>
      )}
    </div>
  );
}
