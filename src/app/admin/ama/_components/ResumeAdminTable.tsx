'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
}

interface ResumeResponse {
  reviews: ResumeReview[];
  total: number;
  page: number;
  limit: number;
}

interface ReviewDraft {
  id: string;
  title: string;
  currentNotes: string | null;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ReviewModal({
  draft,
  onClose,
  onSaved,
}: {
  draft: ReviewDraft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [notesText, setNotesText] = useState(draft.currentNotes ?? '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    const res = await fetch('/api/admin/resume-review', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draft.id, review_notes: notesText }),
    });

    if (res.ok) onSaved();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-xl rounded-2xl border border-border-subtle bg-[#09090b] p-6 shadow-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Review resume</h2>
        </div>

        <div className="mb-4 rounded-xl border border-border-subtle bg-surface-workbench/60 px-4 py-3">
          <p className="text-sm font-medium leading-relaxed text-text-primary">{draft.title}</p>
        </div>

        <div className="relative rounded-xl border border-border-subtle focus-within:border-border-interactive transition-all duration-300">
          <textarea
            ref={textareaRef}
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Your review notes..."
            rows={5}
            className="w-full resize-none rounded-xl bg-surface-workbench/60 px-4 py-3 text-sm leading-relaxed text-text-primary placeholder-text-muted outline-none"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-interactive hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !notesText.trim()}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResumeAdminTable() {
  const [data, setData] = useState<ResumeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [page, setPage] = useState(1);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status: statusFilter });
    const res = await fetch(`/api/admin/resume-review?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleMarkPending = async (id: string) => {
    await fetch('/api/admin/resume-review', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'pending', review_notes: '' }),
    });
    fetchReviews();
  };

  const totalPages = data ? Math.ceil(data.total / (data.limit || 50)) : 1;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">{data ? `${data.total} total` : ''}</p>
          <div className="flex gap-1 rounded-lg border border-border-subtle bg-surface-interactive/40 p-1">
            {(['all', 'pending', 'reviewed'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s ? 'bg-surface-dense text-foreground' : 'text-text-muted hover:text-foreground'
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
        ) : !data || data.reviews.length === 0 ? (
          <div className="rounded-2xl border border-border-subtle bg-surface-workbench/40 px-6 py-12 text-center">
            <p className="text-text-secondary">No resume reviews found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.reviews.map((r) => (
              <div
                key={r.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  r.status === 'reviewed'
                    ? 'border-emerald-500/20 bg-surface-workbench/40'
                    : 'border-border-subtle bg-surface-workbench/60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl border border-border-subtle px-2.5 py-2 text-text-muted">
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3L2 10h3v3h6v-3h3L8 3z" />
                    </svg>
                    <span className="text-xs font-semibold tabular-nums leading-none">{r.vote_count}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-text-secondary">{r.author_name ?? 'Anonymous'}</span>
                      <span className="text-xs text-text-muted">{timeAgo(r.created_at)}</span>
                      {r.status === 'reviewed' && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                          Reviewed
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-medium text-text-primary">{r.title}</p>
                    {r.context && (
                      <p className="mt-0.5 text-sm text-text-secondary line-clamp-2">{r.context}</p>
                    )}
                    <a
                      href={r.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      {r.resume_filename}
                    </a>
                    {r.review_notes && (
                      <p className="mt-1 text-sm italic text-text-secondary line-clamp-2">{r.review_notes}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewDraft({ id: r.id, title: r.title, currentNotes: r.review_notes })}
                      className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-interactive hover:text-foreground"
                    >
                      {r.status === 'reviewed' ? 'Edit review' : 'Review'}
                    </button>
                    {r.status === 'reviewed' && (
                      <button
                        type="button"
                        onClick={() => handleMarkPending(r.id)}
                        className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-red-500/30 hover:text-red-400"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary transition-colors disabled:opacity-40 hover:border-border-interactive hover:text-foreground"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">{page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary transition-colors disabled:opacity-40 hover:border-border-interactive hover:text-foreground"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {reviewDraft && (
        <ReviewModal
          draft={reviewDraft}
          onClose={() => setReviewDraft(null)}
          onSaved={() => {
            setReviewDraft(null);
            fetchReviews();
          }}
        />
      )}
    </>
  );
}
