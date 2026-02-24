import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import StatsSection from './StatsSection';

describe('StatsSection', () => {
  test('renders questions solved count', () => {
    const html = renderToStaticMarkup(
      <StatsSection stats={{ questionsSolved: 12, totalQuestions: 30, articlesRead: 9 }} />
    );

    expect(html).toContain('Questions Solved');
    expect(html).toContain('12 / 30');
  });

  test('renders articles read count', () => {
    const html = renderToStaticMarkup(
      <StatsSection stats={{ questionsSolved: 12, totalQuestions: 30, articlesRead: 9 }} />
    );

    expect(html).toContain('Articles Read');
    expect(html).toContain('>9<');
  });

  test('shows correct percentage bar width', () => {
    const html = renderToStaticMarkup(
      <StatsSection stats={{ questionsSolved: 15, totalQuestions: 20, articlesRead: 2 }} />
    );

    expect(html).toContain('75% complete');
    expect(html).toContain('style="width:75%"');
  });

  test('shows 0% when totalQuestions is 0', () => {
    const html = renderToStaticMarkup(
      <StatsSection stats={{ questionsSolved: 0, totalQuestions: 0, articlesRead: 2 }} />
    );

    expect(html).toContain('0 / 0');
    expect(html).toContain('0% complete');
    expect(html).toContain('style="width:0%"');
  });
});
