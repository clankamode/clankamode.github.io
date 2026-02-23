import { describe, it, expect } from 'vitest';
import { formatCount } from '@/lib/youtube';
import { chunkArticleByHeadings } from '@/lib/article-chunking';

describe('formatCount', () => {
    it('handles comma-separated strings correctly', () => {
        expect(formatCount('1,500')).toBe('1.5K');
        expect(formatCount('1,200,000')).toBe('1.2M');
    });

    it('removes redundant .0 for whole numbers', () => {
        expect(formatCount(1000)).toBe('1K');
        expect(formatCount('1,000,000')).toBe('1M');
    });

    it('returns original string for small numbers', () => {
        expect(formatCount(999)).toBe('999');
        expect(formatCount('42')).toBe('42');
    });
});

describe('chunkArticleByHeadings', () => {
    it('prevents empty introduction chunk when article starts with H2', () => {
        const content = '## First Heading\nContent here.\n## Second Heading\nMore content.';
        const chunks = chunkArticleByHeadings(content);
        
        expect(chunks.length).toBe(2);
        expect(chunks[0].title).toBe('First Heading');
        expect(chunks[0].content).toBe('## First Heading\nContent here.');
        expect(chunks[1].title).toBe('Second Heading');
    });

    it('preserves introduction when text exists before first H2', () => {
        const content = 'Intro text here.\n## Heading\nContent.';
        const chunks = chunkArticleByHeadings(content);
        
        expect(chunks.length).toBe(2);
        expect(chunks[0].title).toBe('Introduction');
        expect(chunks[0].content).toBe('Intro text here.');
    });
});
