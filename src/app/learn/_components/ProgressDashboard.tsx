import Link from 'next/link';
import type { BookmarkItem, ProgressSummary } from '@/lib/progress';

interface ProgressDashboardProps {
  summary: ProgressSummary;
  bookmarks: BookmarkItem[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProgressDashboard({ summary, bookmarks }: ProgressDashboardProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="frame bg-surface-workbench p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Overall</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
              {summary.percent}%
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {summary.completedArticles} of {summary.totalArticles} articles completed
            </p>
          </div>
          <div className="frame bg-surface-workbench p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Streak</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
              {summary.streakDays} days
            </p>
            <p className="mt-2 text-sm text-text-secondary">Keep your momentum alive.</p>
          </div>
          <div className="frame bg-surface-workbench p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Next up</p>
            {summary.nextArticle ? (
              <div className="mt-3 space-y-2">
                <p className="text-base font-semibold text-text-primary">
                  {summary.nextArticle.title}
                </p>
                <p className="text-xs font-mono text-text-muted">
                  {summary.nextArticle.readingTimeMinutes || 5} min read
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-secondary">You cleared the library.</p>
            )}
          </div>
        </section>

        <section className="frame bg-surface-workbench p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Pillar progress</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-text-primary">
                Keep climbing.
              </h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {summary.pillars.map((pillar) => (
              <div key={pillar.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary font-medium">{pillar.name}</span>
                  <span className="text-text-muted font-mono">
                    {pillar.completedArticles}/{pillar.totalArticles}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-dense">
                  <div
                    className="h-2 rounded-full bg-border-interactive"
                    style={{ width: `${pillar.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="frame bg-surface-workbench p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Recent activity</p>
          <div className="mt-5 space-y-4">
            {summary.recentActivity.length ? (
              summary.recentActivity.map((item) => (
                <Link
                  key={`${item.articleId}-${item.completedAt}`}
                  href={`/learn/${item.pillarSlug}/${item.articleSlug}`}
                  className="flex items-center justify-between rounded-lg border border-border-subtle px-4 py-3 text-sm text-text-secondary transition-colors hover:border-border-interactive hover:text-text-primary"
                >
                  <span className="text-text-primary">{item.title}</span>
                  <span className="text-xs font-mono text-text-muted">
                    {formatDate(item.completedAt)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No completions yet.</p>
            )}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="frame bg-surface-workbench p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Continue</p>
          {summary.nextArticle ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-text-muted">Recommended</p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {summary.nextArticle.title}
                </p>
                <p className="mt-2 text-xs font-mono text-text-muted">
                  {summary.nextArticle.readingTimeMinutes || 5} min read
                </p>
              </div>
              <Link
                href={`/learn/${summary.nextArticle.pillarSlug}/${summary.nextArticle.articleSlug}`}
                className="inline-flex items-center justify-center rounded-full border border-border-interactive px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-text-secondary"
              >
                Resume
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-secondary">All caught up.</p>
          )}
        </section>

        <section className="frame bg-surface-workbench p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Bookmarked</p>
          <div className="mt-4 space-y-3">
            {bookmarks.length ? (
              bookmarks.map((bookmark) => (
                <Link
                  key={bookmark.articleId}
                  href={`/learn/${bookmark.pillarSlug}/${bookmark.articleSlug}`}
                  className="block rounded-lg border border-border-subtle px-4 py-3 text-sm transition-colors hover:border-border-interactive"
                >
                  <p className="text-text-primary font-medium">{bookmark.title}</p>
                  <p className="mt-1 text-xs text-text-muted font-mono">
                    {formatDate(bookmark.savedAt)} · {bookmark.readingTimeMinutes || 5} min read
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No bookmarks yet.</p>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
