import { describe, expect, it } from 'vitest';
import { selectDailyDigestCandidate } from '@/lib/daily-digest';

describe('selectDailyDigestCandidate', () => {
  it('prefers stale review concepts over new concepts', () => {
    const digest = selectDailyDigestCandidate({
      concepts: [
        { slug: 'array.contiguous-memory', label: 'Arrays', description: 'Contiguous memory with O(1) indexing.' },
        { slug: 'binary-search.technique', label: 'Binary Search', description: 'Cut the search space in half.' },
      ],
      stats: [{ concept_slug: 'array.contiguous-memory', exposures: 4, internalized_count: 1, last_seen_at: '2026-02-20T12:00:00.000Z' }],
      internalizations: [{ concept_slug: 'array.contiguous-memory', created_at: '2026-02-18T12:00:00.000Z' }],
      trackSlug: 'dsa',
      dayKey: '2026-03-14',
      userSeed: 'user@example.com',
    });

    expect(digest?.mode).toBe('review');
    expect(digest?.conceptSlug).toBe('array.contiguous-memory');
  });

  it('falls back to an unmastered concept with practice when nothing is stale', () => {
    const digest = selectDailyDigestCandidate({
      concepts: [
        { slug: 'array.random-access-o1', label: 'Array Access', description: 'Fast reads by index.' },
        { slug: 'binary-search.technique', label: 'Binary Search', description: 'Cut the search space in half.' },
      ],
      stats: [{ concept_slug: 'array.random-access-o1', exposures: 2, internalized_count: 0, last_seen_at: '2026-03-12T12:00:00.000Z' }],
      internalizations: [],
      trackSlug: 'dsa',
      dayKey: '2026-03-14',
      userSeed: 'user@example.com',
    });

    expect(digest?.mode).toBe('learn');
    expect(digest?.conceptSlug).toBe('binary-search.technique');
    expect(digest?.practiceHref).toContain('/session/practice/');
  });
});
