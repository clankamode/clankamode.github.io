'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ArticleFeedbackGlyph } from '@/components/ui/LearnGlyphs';

export type PageFeedbackVote = 'up' | 'down';

interface PageFeedbackProps {
  pageSlug: string;
  className?: string;
  initialVote?: PageFeedbackVote | null;
  compact?: boolean;
}

const STORAGE_PREFIX = 'page-feedback:';

export function getPageFeedbackStorageKey(pageSlug: string) {
  return `${STORAGE_PREFIX}${pageSlug}`;
}

export function parseStoredPageFeedbackVote(value: string | null): PageFeedbackVote | null {
  if (value === 'up' || value === 'true') {
    return 'up';
  }

  if (value === 'down' || value === 'false') {
    return 'down';
  }

  return null;
}

export function getPageFeedbackButtonState(
  buttonVote: PageFeedbackVote,
  selectedVote: PageFeedbackVote | null
): 'idle' | 'selected' | 'dimmed' {
  if (!selectedVote) {
    return 'idle';
  }

  return buttonVote === selectedVote ? 'selected' : 'dimmed';
}

export default function PageFeedback({
  pageSlug,
  className,
  initialVote = null,
  compact = false,
}: PageFeedbackProps) {
  const storageKey = useMemo(() => getPageFeedbackStorageKey(pageSlug), [pageSlug]);
  const [selectedVote, setSelectedVote] = useState<PageFeedbackVote | null>(initialVote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storedVote = parseStoredPageFeedbackVote(window.localStorage.getItem(storageKey));
      setSelectedVote(storedVote ?? initialVote);
    } catch {
      setSelectedVote(initialVote);
    }

    setSubmitError(null);
  }, [initialVote, storageKey]);

  const voteLocked = selectedVote !== null;

  const submitVote = async (vote: PageFeedbackVote) => {
    if (voteLocked || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageSlug,
          helpful: vote === 'up',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || 'Could not save feedback.');
      }

      setSelectedVote(vote);

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, vote);
        } catch {
          // Ignore localStorage write issues and preserve successful server write.
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save feedback.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const upState = getPageFeedbackButtonState('up', selectedVote);
  const downState = getPageFeedbackButtonState('down', selectedVote);
  const voteButtonClass = compact
    ? 'inline-flex h-[34px] min-w-[72px] items-center justify-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors'
    : 'inline-flex h-[42px] items-center justify-center gap-2.5 rounded-lg border px-4 text-sm font-semibold uppercase tracking-[0.06em] transition-all';
  const voteIconClass = compact ? 'h-4 w-4' : 'h-5 w-5';
  const selectedUpClass = compact
    ? 'border-brand-green/65 bg-brand-green/10 text-brand-green'
    : 'border-brand-green/70 bg-brand-green/16 text-brand-green shadow-[0_0_0_1px_rgba(44,187,93,0.3)]';
  const selectedDownClass = compact
    ? 'border-red-400/70 bg-red-500/10 text-red-300'
    : 'border-red-400/70 bg-red-500/14 text-red-300 shadow-[0_0_0_1px_rgba(248,113,113,0.28)]';
  const dimmedClass = compact
    ? 'border-border-subtle/70 bg-transparent text-text-muted opacity-60'
    : 'border-border-subtle bg-surface-ambient text-text-muted opacity-45';
  const idleClass = compact
    ? 'border-border-subtle/70 bg-transparent text-text-secondary hover:border-border-interactive hover:text-text-primary'
    : 'border-border-subtle bg-surface-interactive text-text-secondary hover:border-border-interactive hover:text-text-primary';

  return (
    <section
      className={cn(
        compact
          ? 'mt-6 rounded-xl border border-border-subtle/70 bg-surface-ambient/45 px-4 py-2'
          : 'frame mt-10 p-4 sm:p-5',
        className
      )}
      data-testid="page-feedback"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn(compact ? 'text-xs font-medium text-text-secondary' : 'text-sm font-medium text-text-primary')}>
          Was this page helpful?
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => submitVote('up')}
            disabled={voteLocked || isSubmitting}
            data-vote="up"
            data-icon="check"
            data-state={upState}
            aria-pressed={selectedVote === 'up'}
            className={cn(
              voteButtonClass,
              upState === 'selected' && selectedUpClass,
              upState === 'dimmed' && dimmedClass,
              upState === 'idle' && idleClass,
              'disabled:cursor-not-allowed'
            )}
            aria-label="Helpful"
          >
            <ArticleFeedbackGlyph vote="up" className={voteIconClass} />
            <span>Yes</span>
          </button>

          <button
            type="button"
            onClick={() => submitVote('down')}
            disabled={voteLocked || isSubmitting}
            data-vote="down"
            data-icon="x"
            data-state={downState}
            aria-pressed={selectedVote === 'down'}
            className={cn(
              voteButtonClass,
              downState === 'selected' && selectedDownClass,
              downState === 'dimmed' && dimmedClass,
              downState === 'idle' && idleClass,
              'disabled:cursor-not-allowed'
            )}
            aria-label="Not helpful"
          >
            <ArticleFeedbackGlyph vote="down" className={voteIconClass} />
            <span>No</span>
          </button>
        </div>
      </div>

      {selectedVote && (
        <p className="mt-3 text-sm text-brand-green" role="status" aria-live="polite">
          Thanks for your feedback!
        </p>
      )}

      {submitError && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {submitError}
        </p>
      )}
    </section>
  );
}
