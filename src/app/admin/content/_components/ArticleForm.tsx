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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [summaryState, setSummaryState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [previousSummary, setPreviousSummary] = useState<string | null>(null);
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

  const handleGenerateSummary = async () => {
    setPreviousSummary(article.excerpt);
    setSummaryState('generating');

    try {
      const response = await fetch('/api/content/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: article.body,
          currentSummary: article.excerpt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();

      if (data.summary) {
        setSummaryState('success');
        onChange({ ...article, excerpt: data.summary });
        setTimeout(() => setSummaryState('idle'), 3000);
      } else {
        setSummaryState('error');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryState('error');
    }
  };

  const handleUndoSummary = () => {
    onChange({ ...article, excerpt: previousSummary });
    setSummaryState('idle');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`/${article.slug}`);
    // Ideally show a toast here, but console for now as per "micro-interactions"
    console.log('URL copied to clipboard');
  };

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
            Edit post info
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-border-subtle bg-surface-interactive p-4 before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Post info</p>
          <p className="text-[10px] text-text-muted/60">How this post appears and where it lives.</p>
        </div>
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
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

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-xs uppercase tracking-[0.2em] text-text-muted">Summary</label>
              <span className="text-[10px] text-text-muted/60">Shown in previews and lists.</span>
            </div>

            {/* AI Assist Buttons */}
            <div className="flex items-center gap-2">
              {summaryState === 'success' && (
                <button
                  type="button"
                  onClick={handleUndoSummary}
                  className="px-2 py-1 text-[10px] uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors"
                >
                  Undo
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={summaryState === 'generating'}
                className={`px-2 py-1 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50 ${summaryState === 'error' ? 'text-red-400' : 'text-accent-primary hover:text-accent-primary-muted'
                  }`}
              >
                {summaryState === 'generating' ? 'Generating...' :
                  summaryState === 'success' ? 'Generated!' :
                    summaryState === 'error' ? 'Retry' :
                      (article.excerpt ? 'Rewrite' : 'Generate summary')}
              </button>
            </div>
          </div>
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

        <div className="flex items-end pb-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={article.is_premium}
              onChange={(event) => onChange({ ...article, is_premium: event.target.checked })}
              className="sr-only"
            />
            <span
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${article.is_premium
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

        <div className="space-y-3 md:col-span-2 pt-2 border-t border-border-subtle/50">
          {!showAdvanced && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-muted font-mono">URL:</span>
              <button
                type="button"
                onClick={copyUrl}
                className="flex items-center gap-2 rounded px-2 py-1 font-mono text-text-secondary hover:bg-surface-dense transition-colors group"
                title="Copy URL"
              >
                /{article.slug}
                <svg className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowAdvanced(true)}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                Advanced ▸
              </button>
            </div>
          )}

          {showAdvanced && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(false)}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  ▾ Advanced
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-[0.2em] text-text-muted">URL</label>
                  <span className="text-[10px] text-text-muted/60">Also called a slug.</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    className="w-full flex-1 rounded-lg border border-border-subtle bg-surface-dense px-4 py-2 text-text-primary transition-colors focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono text-sm"
                    value={article.slug}
                    onChange={(event) => {
                      if (!slugLocked) {
                        setSlugLocked(true);
                      }
                      onChange({ ...article, slug: event.target.value });
                    }}
                  />
                  <div className="group relative">
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
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border-subtle bg-surface-workbench px-3 py-1.5 text-xs text-text-primary opacity-0 shadow-[var(--shadow-lift)] transition-opacity group-hover:opacity-100 z-10">
                      {slugLocked
                        ? 'Slug is locked. Click to unlock and auto-generate from title.'
                        : 'Slug auto-generates from title. Click to lock and edit manually.'}
                      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-surface-workbench" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
