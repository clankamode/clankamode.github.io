import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import PageFeedback, {
  getPageFeedbackButtonState,
  getPageFeedbackStorageKey,
  parseStoredPageFeedbackVote,
} from './PageFeedback';

describe('PageFeedback', () => {
  test('renders prompt with custom svg vote controls', () => {
    const html = renderToStaticMarkup(<PageFeedback pageSlug="/learn/arrays/two-sum" />);

    expect(html).toContain('Was this page helpful?');
    expect(html).toContain('data-vote="up"');
    expect(html).toContain('data-vote="down"');
    expect(html).toContain('data-icon="check"');
    expect(html).toContain('data-icon="x"');
    expect(html).toContain('Yes');
    expect(html).toContain('No');
    expect(html).not.toContain('👍');
    expect(html).not.toContain('👎');
  });

  test('renders selected and dimmed states with thank-you copy after vote', () => {
    const html = renderToStaticMarkup(
      <PageFeedback pageSlug="/learn/arrays/two-sum" initialVote="up" />
    );

    expect(html).toMatch(/data-vote="up"[^>]*data-state="selected"/);
    expect(html).toMatch(/data-vote="down"[^>]*data-state="dimmed"/);
    expect(html).toContain('Thanks for your feedback!');
  });
});

describe('PageFeedback helpers', () => {
  test('builds stable localStorage key', () => {
    expect(getPageFeedbackStorageKey('/learn/arrays/two-sum')).toBe(
      'page-feedback:/learn/arrays/two-sum'
    );
  });

  test.each([
    { value: 'up', expected: 'up' as const },
    { value: 'down', expected: 'down' as const },
    { value: 'true', expected: 'up' as const },
    { value: 'false', expected: 'down' as const },
    { value: 'unknown', expected: null },
    { value: null, expected: null },
  ])('parses stored value "$value"', ({ value, expected }) => {
    expect(parseStoredPageFeedbackVote(value)).toBe(expected);
  });

  test.each([
    { buttonVote: 'up' as const, selectedVote: null, expected: 'idle' as const },
    { buttonVote: 'up' as const, selectedVote: 'up' as const, expected: 'selected' as const },
    { buttonVote: 'down' as const, selectedVote: 'up' as const, expected: 'dimmed' as const },
  ])('derives state for button "$buttonVote" with selected "$selectedVote"', ({ buttonVote, selectedVote, expected }) => {
    expect(getPageFeedbackButtonState(buttonVote, selectedVote)).toBe(expected);
  });
});
