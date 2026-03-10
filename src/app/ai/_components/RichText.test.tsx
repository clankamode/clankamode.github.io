import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { RichText } from './RichText';

describe('RichText', () => {
  test('renders related video bullets as YouTube embeds', () => {
    const html = renderToStaticMarkup(
      <RichText content={'Related videos\n- Interviewing Software Engineers Live | Episode 6 — https://www.youtube.com/watch?v=gB50QT8lbZU'} />
    );

    expect(html).toContain('https://www.youtube.com/embed/gB50QT8lbZU');
    expect(html).toContain('Interviewing Software Engineers Live | Episode 6');
  });
});
