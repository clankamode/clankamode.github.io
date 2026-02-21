'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

interface FeedbackAttachment {
  url: string;
  name?: string;
}

interface FeedbackRow {
  id: string;
  created_at: string;
  category: string;
  message: string;
  page_path: string | null;
  contact_email: string | null;
  user_email: string | null;
  status: string;
  isOpen: boolean;
  metadata?: { attachments?: FeedbackAttachment[] };
}

interface FeedbackResponse {
  feedback: FeedbackRow[];
  total: number;
  page: number;
  limit: number;
}

interface PendingStatusChange {
  id: string;
  messagePreview: string;
  newIsOpen: boolean;
}

const LIMIT = 20;
const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All categories' },
  { value: 'bug', label: 'Bug' },
  { value: 'idea', label: 'Idea' },
  { value: 'content', label: 'Content' },
  { value: 'other', label: 'Other' },
];

function truncate(s: string, len: number): string {
  if (s.length <= len) return s;
  return s.slice(0, len) + '…';
}

function isImageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(jpe?g|png|gif|webp|avif)(\?|$)/.test(path) || path.includes('blob') || path.includes('image');
  } catch {
    return false;
  }
}

export function FeedbackTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('open');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<PendingStatusChange | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
      status: statusFilter,
      category: categoryFilter,
    });
    const res = await fetch(`/api/admin/feedback?${params}`);
    if (!res.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    const json: FeedbackResponse = await res.json();
    setData(json);
    setLoading(false);
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleStatusChange = useCallback(async (id: string, open: boolean) => {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: open ? 'open' : 'closed' }),
    });
    setUpdatingId(null);
    if (res.ok) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          feedback: prev.feedback.map((f) =>
            f.id === id ? { ...f, status: open ? 'new' : 'closed', isOpen: open } : f
          ),
        };
      });
    }
    setPendingStatus(null);
  }, []);

  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name?: string } | null>(null);

  const onToggleClick = (row: FeedbackRow) => {
    setPendingStatus({
      id: row.id,
      messagePreview: truncate(row.message, 50),
      newIsOpen: !row.isOpen,
    });
  };

  const attachments = (row: FeedbackRow): FeedbackAttachment[] =>
    row.metadata?.attachments && Array.isArray(row.metadata.attachments)
      ? row.metadata.attachments.filter((a): a is FeedbackAttachment => typeof a?.url === 'string')
      : [];

  const confirmStatusChange = () => {
    if (!pendingStatus) return;
    handleStatusChange(pendingStatus.id, pendingStatus.newIsOpen);
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-8 text-center text-text-muted">
        Loading feedback…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-8 text-center text-text-secondary">
        Failed to load feedback.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 border-b border-border-subtle p-4">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          Status
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border-subtle bg-surface-dense px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-border-interactive"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          Category
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border-subtle bg-surface-dense px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-border-interactive"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-text-muted">
          {data.total} item{data.total !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-dense/80 text-left text-text-muted">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium min-w-[180px] max-w-[320px]">Message</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Attachments</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.feedback.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border-subtle/60 hover:bg-surface-dense/40 transition-colors align-top"
              >
                <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                  {new Date(row.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-text-secondary capitalize">{row.category}</td>
                <td className="px-4 py-3 text-text-primary min-w-[180px] max-w-[320px] whitespace-normal break-words">
                  {row.message}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {row.contact_email || row.user_email || '—'}
                </td>
                <td className="px-4 py-3">
                  {attachments(row).length === 0 ? (
                    <span className="text-text-muted text-xs">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {attachments(row).map((att, i) => (
                        <span key={i} className="inline-flex items-center gap-1">
                          {isImageUrl(att.url) ? (
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(att)}
                              className="rounded border border-border-subtle overflow-hidden hover:ring-1 hover:ring-border-interactive focus:outline-none focus:ring-1 focus:ring-border-interactive"
                            >
                              <Image
                                src={att.url}
                                alt={att.name ?? 'Attachment'}
                                width={48}
                                height={48}
                                className="h-12 w-12 object-cover"
                              />
                            </button>
                          ) : (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#2cbb5d] hover:underline truncate max-w-[100px]"
                            >
                              {att.name ?? 'View'}
                            </a>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                      row.isOpen
                        ? 'bg-[#2cbb5d]/20 text-[#2cbb5d]'
                        : 'bg-surface-dense text-text-muted'
                    }`}
                  >
                    {row.isOpen ? 'Open' : 'Closed'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={updatingId === row.id}
                    onClick={() => onToggleClick(row)}
                    className="rounded border border-border-subtle px-2 py-1 text-xs text-text-secondary hover:bg-surface-interactive hover:text-text-primary disabled:opacity-50"
                  >
                    {row.isOpen ? 'Close' : 'Reopen'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-interactive hover:text-text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-interactive hover:text-text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
          >
            Next
          </button>
        </div>
      )}

      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Attachment preview"
          onClick={() => setPreviewAttachment(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewAttachment(null)}
            className="absolute top-4 right-4 rounded-lg bg-surface-dense px-3 py-1.5 text-sm text-text-primary hover:bg-surface-interactive"
          >
            Close
          </button>
          <Image
            src={previewAttachment.url}
            alt={previewAttachment.name ?? 'Preview'}
            width={1920}
            height={1080}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {pendingStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-status-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-workbench p-6 shadow-xl">
            <h2 id="confirm-status-title" className="text-lg font-semibold text-text-primary">
              {pendingStatus.newIsOpen ? 'Reopen feedback?' : 'Close feedback?'}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {pendingStatus.newIsOpen ? (
                <>This item will be marked as open.</>
              ) : (
                <>This item will be marked as closed.</>
              )}
              <span className="mt-2 block text-text-muted">&quot;{pendingStatus.messagePreview}&quot;</span>
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingStatus(null)}
                className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-interactive hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className="rounded-lg bg-[#2cbb5d] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e8a42]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
