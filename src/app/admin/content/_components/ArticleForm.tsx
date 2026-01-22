'use client';

import { useMemo, useState } from 'react';

interface ArticleData {
  id: string;
  topic_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  is_premium: boolean;
  is_published: boolean;
}

interface PillarTopic {
  id: string;
  name: string;
  topics: { id: string; name: string }[];
}

interface ArticleFormProps {
  article: ArticleData;
  pillars: PillarTopic[];
  onChange: (next: ArticleData) => void;
}

export default function ArticleForm({ article, pillars, onChange }: ArticleFormProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [slugLocked, setSlugLocked] = useState(false);
  const topicOptions = pillars.flatMap((pillar) =>
    pillar.topics.map((topic) => ({
      id: topic.id,
      label: `${pillar.name} / ${topic.name}`,
    }))
  );
  const activeTopicLabel = useMemo(
    () => topicOptions.find((topic) => topic.id === article.topic_id)?.label ?? 'No topic selected',
    [article.topic_id, topicOptions]
  );

  const slugFromTitle = (title: string) =>
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  if (collapsed) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-interactive px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-text-primary">{article.title || 'Untitled'}</span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">{activeTopicLabel}</span>
            {article.is_premium && (
              <span className="rounded-full bg-brand-amber/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-brand-amber">
                Premium
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="text-xs uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-text-primary"
          >
            Edit metadata
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-border-subtle bg-surface-interactive p-4 before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Metadata</p>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-dense/60 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-text-muted transition-colors hover:text-text-primary"
          aria-expanded={!collapsed}
        >
          Collapse
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3 w-3 transition-transform">
            <path
              d="M5 8l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Title</label>
          <input
            className="w-full rounded-lg border border-border-subtle bg-surface-dense px-4 py-2 text-text-primary transition-colors focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={article.title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              const nextArticle = { ...article, title: nextTitle };
              if (!slugLocked) {
                nextArticle.slug = slugFromTitle(nextTitle);
              }
              onChange(nextArticle);
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Slug</label>
          <div className="flex items-center gap-2">
            <input
              className="w-full flex-1 rounded-lg border border-border-subtle bg-surface-dense px-4 py-2 text-text-primary transition-colors focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={article.slug}
              onChange={(event) => {
                if (!slugLocked) {
                  setSlugLocked(true);
                }
                onChange({ ...article, slug: event.target.value });
              }}
            />
            <button
              type="button"
              onClick={() => {
                const nextLocked = !slugLocked;
                setSlugLocked(nextLocked);
                if (!nextLocked) {
                  onChange({ ...article, slug: slugFromTitle(article.title) });
                }
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface-dense/60 text-text-muted transition-colors hover:text-text-primary"
              aria-pressed={slugLocked}
              aria-label={slugLocked ? 'Unlock slug auto-generation' : 'Lock slug auto-generation'}
            >
              {slugLocked ? (
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                  <path
                    d="M6 9V7a4 4 0 018 0v2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <rect x="4.5" y="9" width="11" height="8" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                  <path
                    d="M6 9V7a4 4 0 017-2.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <rect x="4.5" y="9" width="11" height="8" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Excerpt</label>
          <textarea
            className="w-full rounded-lg border border-border-subtle bg-surface-dense px-4 py-2 text-text-primary transition-colors focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={3}
            value={article.excerpt ?? ''}
            onChange={(event) => onChange({ ...article, excerpt: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Topic</label>
          <select
            className="w-full rounded-lg border border-border-subtle bg-surface-dense px-4 py-2 text-text-primary transition-colors focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={article.topic_id}
            onChange={(event) => onChange({ ...article, topic_id: event.target.value })}
          >
            {topicOptions.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={article.is_premium}
              onChange={(event) => onChange({ ...article, is_premium: event.target.checked })}
              className="sr-only"
            />
            <span
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                article.is_premium
                  ? 'border-brand-green bg-brand-green'
                  : 'border-border-subtle bg-surface-dense hover:border-border-interactive'
              }`}
            >
              {article.is_premium && (
                <svg
                  className="h-3.5 w-3.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span>Premium content</span>
          </label>
        </div>
      </div>
    </div>
  );
}
