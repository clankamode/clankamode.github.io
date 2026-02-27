import { describe, it, expect } from 'vitest';

const ARTICLE_REF_REGEX = /\[ref:([^\]]+)\]/g;

function extractArticleRefs(content: string): string[] {
  const refs: string[] = [];
  ARTICLE_REF_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ARTICLE_REF_REGEX.exec(content)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

function stripArticleRefs(content: string): string {
  return content.replace(/\[ref:[^\]]+\]/g, '').trimEnd();
}

describe('extractArticleRefs', () => {
  it('extracts a single ref', () => {
    expect(extractArticleRefs('Look at the trade-offs table. [ref:the-trade-offs]')).toEqual(['the-trade-offs']);
  });

  it('extracts multiple refs', () => {
    expect(extractArticleRefs('Check [ref:memory-layout] and [ref:dynamic-resizing].')).toEqual(['memory-layout', 'dynamic-resizing']);
  });

  it('returns empty for no refs', () => {
    expect(extractArticleRefs('No references here.')).toEqual([]);
  });

  it('handles refs with numbers', () => {
    expect(extractArticleRefs('[ref:o1-random-access]')).toEqual(['o1-random-access']);
  });
});

describe('stripArticleRefs', () => {
  it('strips refs and trims trailing whitespace', () => {
    expect(stripArticleRefs('Great question! [ref:memory-layout]')).toBe('Great question!');
  });

  it('strips multiple refs', () => {
    expect(stripArticleRefs('See [ref:a] and also [ref:b] for details.')).toBe('See  and also  for details.');
  });

  it('leaves content without refs unchanged', () => {
    expect(stripArticleRefs('No refs here.')).toBe('No refs here.');
  });
});
