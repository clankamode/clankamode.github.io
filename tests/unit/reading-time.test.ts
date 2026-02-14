import { describe, expect, it } from 'vitest';
import { estimateReadingTimeMinutes } from '@/lib/reading-time';

describe('estimateReadingTimeMinutes', () => {
  it('returns minimum for empty input', () => {
    expect(estimateReadingTimeMinutes('')).toBe(1);
    expect(estimateReadingTimeMinutes('', { minMinutes: 2 })).toBe(2);
  });

  it('weights code heavier than plain prose', () => {
    const prose = 'word '.repeat(220);
    const code = `\`\`\`ts\n${'const x = 1;\n'.repeat(220)}\`\`\``;

    const proseMinutes = estimateReadingTimeMinutes(prose);
    const codeMinutes = estimateReadingTimeMinutes(code);

    expect(codeMinutes).toBeGreaterThan(proseMinutes);
  });

  it('respects min/max bounds', () => {
    const longText = 'word '.repeat(10000);
    expect(estimateReadingTimeMinutes(longText, { minMinutes: 1, maxMinutes: 5 })).toBe(5);
    expect(estimateReadingTimeMinutes('tiny', { minMinutes: 3, maxMinutes: 10 })).toBe(3);
  });
});
