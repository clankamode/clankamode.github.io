import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Snowflake } from 'lucide-react';
import ActivityHeatmap from '@/app/learn/_components/ActivityHeatmap';
import type { FingerprintData } from '@/app/actions/fingerprint';
import type { BookmarkItem, ProgressSummary } from '@/lib/progress';

interface OwnProfileProgressProps {
  summary: ProgressSummary;
  bookmarks: BookmarkItem[];
  fingerprint: FingerprintData | null;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function slugToLabel(slug: string) {
  const leaf = slug.split('.').pop() ?? slug;
  return leaf
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function looksLikeSlug(value: string) {
  return /^[a-z0-9._-]+$/.test(value) && value === value.toLowerCase();
}

function getConceptLabel(item: NonNullable<FingerprintData>['internalizations'][number]) {
  const shortLabel = item.concept.short_label?.trim();
  if (shortLabel) return shortLabel;

  const rawLabel = item.concept.label.trim();
  if (rawLabel && !looksLikeSlug(rawLabel)) return rawLabel;

  return slugToLabel(item.concept_slug);
}

function getDisplayNote(note: string | null) {
  if (!note) return null;

  const trimmed = note.trim();
  if (!trimmed) return null;

  // Filter obvious test junk like long lowercase character runs.
  if (/^[a-z]{8,}$/.test(trimmed)) return null;

  return trimmed;
}

function getStreakDayMeta(dayState: ProgressSummary['streakDayStates'][number]) {
  if (dayState.state === 'earned') {
    return {
      label: 'Earned day',
      detail: 'Completed',
      icon: CheckCircle2,
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    };
  }

  if (dayState.reason === 'weekend-off') {
    return {
      label: 'Weekend off',
      detail: 'Protected',
      icon: Snowflake,
      className: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
    };
  }

  return {
    label: 'Manual freeze',
    detail: 'Protected',
    icon: Snowflake,
    className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
  };
}

export default function OwnProfileProgress({
  summary,
  bookmarks,
  fingerprint,
}: OwnProfileProgressProps) {
  const latestInternalizations = fingerprint?.internalizations.slice(0, 3) ?? [];
  const streakPreview = summary.streakDayStates.slice(0, 6);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
      <div className="space-y-6">
        <div className="frame bg-surface-interactive/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Streak trail</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">Protected Momentum</h2>
            </div>
            <p className="text-sm text-text-secondary">{summary.streakDays} active days</p>
          </div>
          {streakPreview.length ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {streakPreview.map((dayState) => {
                  const meta = getStreakDayMeta(dayState);
                  const Icon = meta.icon;

                  return (
                    <div
                      key={`${dayState.date}-${dayState.reason ?? dayState.state}`}
                      className={`rounded-xl border px-4 py-3 ${meta.className}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <p className="text-sm font-semibold">{meta.label}</p>
                      </div>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] opacity-80">
                        {meta.detail}
                      </p>
                      <p className="mt-1 text-xs opacity-90">{formatDate(dayState.date)}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-text-muted">
                Check marks are earned days. Snowflakes are protected streak days.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-text-secondary">Complete an article to start your streak trail.</p>
          )}
        </div>

        <div className="frame bg-surface-interactive/70 p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Activity map</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">Consistency Window</h2>
          <p className="mt-2 text-sm text-text-secondary">Every completion lands on the board. Keep the chain alive.</p>
          <div className="mt-5">
            <ActivityHeatmap completionDates={summary.allCompletionDates} />
          </div>
        </div>

        <div className="frame bg-surface-interactive/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Pillar progress</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">Coverage by Domain</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {summary.pillars.length ? (
              summary.pillars.map((pillar) => (
                <div key={pillar.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">{pillar.name}</span>
                    <span className="font-mono text-text-muted">
                      {pillar.completedArticles}/{pillar.totalArticles}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-dense">
                    <div
                      className="h-2 rounded-full bg-brand-green transition-all duration-300"
                      style={{ width: `${pillar.percent}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">Pillar progress appears once your first article is complete.</p>
            )}
          </div>
        </div>

        <div className="frame bg-surface-interactive/70 p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Recent activity</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">Last Completed</h2>
          <div className="mt-5 space-y-3">
            {summary.recentActivity.length ? (
              summary.recentActivity.map((item) => (
                <Link
                  key={`${item.articleId}-${item.completedAt}`}
                  href={`/learn/${item.pillarSlug}/${item.articleSlug}`}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-ambient/60 px-4 py-3 text-sm transition-colors hover:border-border-interactive"
                >
                  <span className="text-text-primary">{item.title}</span>
                  <span className="font-mono text-xs text-text-muted">{formatDate(item.completedAt)}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No completions yet. Start with your first lesson.</p>
            )}
          </div>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <div className="frame bg-surface-interactive/70 p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Next up</p>
          {summary.nextArticle ? (
            <div className="mt-3">
              <p className="text-base font-semibold text-text-primary">{summary.nextArticle.title}</p>
              <p className="mt-2 font-mono text-xs text-text-muted">
                {summary.nextArticle.readingTimeMinutes || 5} min read
              </p>
              <Link
                href={`/learn/${summary.nextArticle.pillarSlug}/${summary.nextArticle.articleSlug}`}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-border-interactive px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-brand-green"
              >
                Resume session
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-secondary">Library completed. Revisit key lessons or start practice.</p>
          )}
        </div>

        <div className="frame bg-surface-interactive/70 p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Bookmarks</p>
          <div className="mt-3 space-y-2.5">
            {bookmarks.length ? (
              bookmarks.slice(0, 4).map((bookmark) => (
                <Link
                  key={bookmark.articleId}
                  href={`/learn/${bookmark.pillarSlug}/${bookmark.articleSlug}`}
                  className="block rounded-lg border border-border-subtle bg-surface-ambient/60 px-4 py-3 transition-colors hover:border-border-interactive"
                >
                  <p className="text-sm font-medium text-text-primary">{bookmark.title}</p>
                  <p className="mt-1 font-mono text-xs text-text-muted">
                    {formatDate(bookmark.savedAt)} · {bookmark.readingTimeMinutes || 5} min read
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-text-secondary">Save articles to build your reading queue.</p>
            )}
          </div>
        </div>

        <div className="frame bg-surface-interactive/70 p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Internalization log</p>
          <div className="mt-3 space-y-2.5">
            {latestInternalizations.length ? (
              latestInternalizations.map((item) => {
                const displayNote = getDisplayNote(item.note);

                return (
                  <div key={item.id} className="rounded-lg border border-border-subtle bg-surface-ambient/60 px-4 py-3">
                    <p className="text-sm font-medium text-text-primary">{getConceptLabel(item)}</p>
                    {displayNote && (
                      <p className="mt-1 line-clamp-1 text-xs text-text-secondary">{displayNote}</p>
                    )}
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                      {item.picked} · {formatDate(item.created_at)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-text-secondary">
                Complete session rituals in Session Mode to build your internalization history.
              </p>
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}
