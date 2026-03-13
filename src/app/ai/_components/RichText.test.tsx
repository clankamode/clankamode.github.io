import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { RichText } from './RichText';
import { TextCard } from './TextCard';

describe('RichText', () => {
  test('renders related video bullets as YouTube embeds', () => {
    const html = renderToStaticMarkup(
      <RichText content={'Related videos\n- Interviewing Software Engineers Live | Episode 6 — https://www.youtube.com/watch?v=gB50QT8lbZU'} />
    );

    expect(html).toContain('https://www.youtube.com/embed/gB50QT8lbZU');
    expect(html).toContain('Interviewing Software Engineers Live | Episode 6');
  });

  test('renders markdown YouTube links as embeds in text cards', () => {
    const html = renderToStaticMarkup(
      <TextCard content={'Related videos\n- [System Design Interview Basics](https://youtu.be/dQw4w9WgXcQ)'} />
    );

    expect(html).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(html).toContain('System Design Interview Basics');
  });
});
