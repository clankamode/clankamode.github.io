import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import QuestionsPageSkeleton from './QuestionsPageSkeleton';

describe('QuestionsPageSkeleton', () => {
  test('renders the question list loading layout', () => {
    const html = renderToStaticMarkup(<QuestionsPageSkeleton />);

    expect(html).toContain('Community Questions');
    expect(html).toContain('Top Questions');
    expect(html).toContain('Have a question?');
    expect(html).toContain('aria-hidden="true"');
  });
});
