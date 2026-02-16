import { describe, expect, it } from 'vitest';
import { normalizeSessionItemHref, resolvePrimaryConceptSlug } from '@/lib/progress';
import type { LearningArticle } from '@/types/content';

describe('session repeat cooldown helpers', () => {
  it('normalizes hrefs by removing query/hash so chunk variants map to the same article', () => {
    expect(normalizeSessionItemHref('/learn/dsa/efficient-string-building?sessionChunk=1')).toBe('/learn/dsa/efficient-string-building');
    expect(normalizeSessionItemHref('/learn/dsa/efficient-string-building#top')).toBe('/learn/dsa/efficient-string-building');
  });

  it('falls back to deterministic article concept slug when metadata is missing', () => {
    const fallback = resolvePrimaryConceptSlug({
      slug: 'efficient-string-building',
      primary_concept: null,
    } as LearningArticle);

    expect(fallback).toBe('article.efficient-string-building');
  });

  it('prefers explicit primary concept slug when present', () => {
    const explicit = resolvePrimaryConceptSlug({
      slug: 'efficient-string-building',
      primary_concept: 'strings.string-builders',
    } as LearningArticle);

    expect(explicit).toBe('strings.string-builders');
  });
});
