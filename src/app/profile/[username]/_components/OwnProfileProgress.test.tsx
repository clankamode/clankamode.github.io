import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import OwnProfileProgress from './OwnProfileProgress';
import type { FingerprintData } from '@/app/actions/fingerprint';
import type { BookmarkItem, ProgressSummary } from '@/lib/progress';

const nowIso = new Date().toISOString();

function buildSummary(overrides: Partial<ProgressSummary> = {}): ProgressSummary {
  return {
    totalArticles: 20,
    completedArticles: 8,
    percent: 40,
    streakDays: 3,
    streakDayStates: [
      { date: '2026-02-20', state: 'earned' },
      { date: '2026-02-19', state: 'earned' },
      { date: '2026-02-18', state: 'freeze', reason: 'manual-freeze' },
    ],
    pillars: [
      {
        id: 'pillar-1',
        slug: 'arrays',
        name: 'Arrays',
        totalArticles: 10,
        completedArticles: 5,
        percent: 50,
      },
      {
        id: 'pillar-2',
        slug: 'graphs',
        name: 'Graphs',
        totalArticles: 10,
        completedArticles: 3,
        percent: 30,
      },
    ],
    recentActivity: [
      {
        articleId: 'a1',
        articleSlug: 'two-sum',
        pillarSlug: 'arrays',
        title: 'Two Sum Patterns',
        completedAt: '2026-02-20T12:00:00.000Z',
      },
      {
        articleId: 'a2',
        articleSlug: 'bfs-basics',
        pillarSlug: 'graphs',
        title: 'BFS Basics',
        completedAt: '2026-02-19T12:00:00.000Z',
      },
    ],
    nextArticle: {
      articleId: 'a3',
      articleSlug: 'sliding-window',
      pillarSlug: 'arrays',
      title: 'Sliding Window',
      readingTimeMinutes: 8,
    },
    completedIds: ['a1', 'a2'],
    allCompletionDates: [nowIso],
    ...overrides,
  };
}

function buildBookmarks(items: Partial<BookmarkItem>[] = []): BookmarkItem[] {
  if (!items.length) return [];

  return items.map((item, idx) => ({
    articleId: item.articleId ?? `bookmark-${idx}`,
    articleSlug: item.articleSlug ?? `bookmark-article-${idx}`,
    pillarSlug: item.pillarSlug ?? 'arrays',
    title: item.title ?? `Bookmark ${idx}`,
    excerpt: item.excerpt ?? null,
    readingTimeMinutes: item.readingTimeMinutes ?? 6,
    savedAt: item.savedAt ?? '2026-02-18T12:00:00.000Z',
  }));
}

function buildFingerprint(overrides: Partial<FingerprintData> = {}): FingerprintData {
  return {
    conceptStats: [],
    stubbornConcepts: [],
    internalizations: [
      {
        id: 'i1',
        concept_slug: 'dsa.two-pointers',
        track_slug: 'dsa',
        picked: 'stuck',
        note: 'Need to slow down and track boundaries.',
        created_at: '2026-02-21T12:00:00.000Z',
        session_id: 's1',
        concept: {
          label: 'Two Pointers',
          short_label: null,
        },
      },
    ],
    ...overrides,
  };
}

describe('OwnProfileProgress', () => {
  test('renders heatmap section when summary has completion dates', () => {
    const html = renderToStaticMarkup(
      <OwnProfileProgress
        summary={buildSummary()}
        bookmarks={[]}
        fingerprint={null}
      />
    );

    expect(html).toContain('Consistency Window');
    expect(html).toContain('role="grid"');
    expect(html).toContain('data-count="1"');
  });

  test('renders pillar progress bars for each pillar in summary', () => {
    const html = renderToStaticMarkup(
      <OwnProfileProgress
        summary={buildSummary()}
        bookmarks={[]}
        fingerprint={null}
      />
    );

    expect(html).toContain('Arrays');
    expect(html).toContain('Graphs');
    expect(html).toContain('style="width:50%"');
    expect(html).toContain('style="width:30%"');
  });

  test('renders recent activity items', () => {
    const html = renderToStaticMarkup(
      <OwnProfileProgress
        summary={buildSummary()}
        bookmarks={[]}
        fingerprint={null}
      />
    );

    expect(html).toContain('Two Sum Patterns');
    expect(html).toContain('BFS Basics');
    expect(html).toContain('href="/learn/arrays/two-sum"');
    expect(html).toContain('href="/learn/graphs/bfs-basics"');
  });

  test('shows bookmark empty state when bookmarks array is empty', () => {
    const html = renderToStaticMarkup(
      <OwnProfileProgress
        summary={buildSummary()}
        bookmarks={[]}
        fingerprint={null}
      />
    );

    expect(html).toContain('Save articles to build your reading queue.');
  });

  test('shows bookmark items when present', () => {
    const html = renderToStaticMarkup(
      <OwnProfileProgress
        summary={buildSummary()}
        bookmarks={buildBookmarks([
          {
            articleId: 'b1',
            articleSlug: 'union-find',
            pillarSlug: 'graphs',
            title: 'Union Find',
          },
        ])}
        fingerprint={null}
      />
    );

    expect(html).toContain('Union Find');
    expect(html).toContain('href="/learn/graphs/union-find"');
  });

  test('shows internalization log items when fingerprint has internalizations', () => {
    const html = renderToStaticMarkup(
      <OwnProfileProgress
        summary={buildSummary()}
        bookmarks={[]}
        fingerprint={buildFingerprint()}
      />
    );

    expect(html).toContain('Two Pointers');
    expect(html).toContain('Need to slow down and track boundaries.');
    expect(html).toContain('stuck');
  });

  test('does not crash when fingerprint is null', () => {
    const html = renderToStaticMarkup(
      <OwnProfileProgress
        summary={buildSummary()}
        bookmarks={[]}
        fingerprint={null}
      />
    );

    expect(html).toContain('Internalization log');
    expect(html).toContain('Complete session rituals in Session Mode to build your internalization history.');
  });
});
