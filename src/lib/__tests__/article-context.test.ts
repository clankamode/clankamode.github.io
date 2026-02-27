import { describe, it, expect } from 'vitest';
import { extractArticleContext } from '../article-context';
import type { LearningArticle } from '@/types/content';

function makeArticle(overrides: Partial<LearningArticle> = {}): LearningArticle {
  return {
    id: 'test-id',
    title: 'Arrays',
    slug: 'arrays',
    body: '',
    pillar_slug: 'dsa',
    primary_concept: null,
    concept_tags: [],
    ...overrides,
  } as LearningArticle;
}

describe('extractArticleContext', () => {
  describe('sections extraction', () => {
    it('extracts h2 and h3 headings with slugified IDs', () => {
      const article = makeArticle({
        body: '## Memory Layout\nSome content.\n\n## The Trade-offs\nMore.\n\n### Two Pointers\nPattern.',
      });
      const ctx = extractArticleContext(article);
      expect(ctx.sections).toEqual([
        { id: 'memory-layout', text: 'Memory Layout' },
        { id: 'the-trade-offs', text: 'The Trade-offs' },
        { id: 'two-pointers', text: 'Two Pointers' },
      ]);
    });

    it('returns empty sections for articles without headings', () => {
      const article = makeArticle({ body: 'Just a paragraph with no headings.' });
      const ctx = extractArticleContext(article);
      expect(ctx.sections).toEqual([]);
    });

    it('ignores h1 and h4+ headings', () => {
      const article = makeArticle({ body: '# Title\n## Valid Section\n#### Too Deep' });
      const ctx = extractArticleContext(article);
      expect(ctx.sections).toHaveLength(1);
      expect(ctx.sections[0].text).toBe('Valid Section');
    });

    it('slugifies headings with special characters', () => {
      const article = makeArticle({ body: '## O(1) Random Access & Why It Matters' });
      const ctx = extractArticleContext(article);
      expect(ctx.sections[0].id).toBe('o1-random-access-why-it-matters');
    });
  });

  describe('code blocks', () => {
    it('extracts fenced code blocks', () => {
      const ctx = extractArticleContext(makeArticle({ body: '```js\nconst x = 1;\n```' }));
      expect(ctx.codeBlocks).toHaveLength(1);
      expect(ctx.codeBlocks[0]).toContain('const x = 1');
    });

    it('extracts HTML pre blocks', () => {
      const ctx = extractArticleContext(makeArticle({ body: '<pre>address = base + i</pre>' }));
      expect(ctx.codeBlocks).toHaveLength(1);
      expect(ctx.codeBlocks[0]).toContain('address = base + i');
    });
  });

  describe('key concepts', () => {
    it('extracts primary concept and tags', () => {
      const ctx = extractArticleContext(makeArticle({
        primary_concept: 'Arrays',
        concept_tags: ['contiguous memory', 'indexing'],
        body: '',
      }));
      expect(ctx.keyConcepts).toContain('Arrays');
      expect(ctx.keyConcepts).toContain('contiguous memory');
    });

    it('extracts bold text as concepts', () => {
      const ctx = extractArticleContext(makeArticle({
        body: 'Arrays give **O(1) random access** because of **contiguous memory**.',
      }));
      expect(ctx.keyConcepts).toContain('O(1) random access');
      expect(ctx.keyConcepts).toContain('contiguous memory');
    });
  });

  describe('summary', () => {
    it('caps summary at ~200 chars', () => {
      const ctx = extractArticleContext(makeArticle({ body: 'A'.repeat(300) }));
      expect(ctx.summary.length).toBeLessThanOrEqual(201);
    });

    it('handles empty body', () => {
      const ctx = extractArticleContext(makeArticle({ body: '' }));
      expect(ctx.summary).toBe('');
    });
  });

  describe('null safety', () => {
    it('handles null body gracefully', () => {
      const ctx = extractArticleContext(makeArticle({ body: null as unknown as string }));
      expect(ctx.sections).toEqual([]);
      expect(ctx.codeBlocks).toEqual([]);
      expect(ctx.summary).toBe('');
    });
  });
});
