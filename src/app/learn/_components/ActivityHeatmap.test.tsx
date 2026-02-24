import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import ActivityHeatmap from './ActivityHeatmap';

function renderHeatmap(completionDates: string[]) {
  return renderToStaticMarkup(<ActivityHeatmap completionDates={completionDates} />);
}

function getCellTags(html: string) {
  return Array.from(html.matchAll(/<button[^>]*data-testid="activity-cell"[^>]*>/g)).map(
    (match) => match[0]
  );
}

describe('ActivityHeatmap', () => {
  test('renders without crashing when completionDates is empty', () => {
    const html = renderHeatmap([]);
    expect(html).toContain('role="grid"');
  });

  test('renders exactly 26 weeks x 7 days of cells', () => {
    const html = renderHeatmap([]);
    const cells = getCellTags(html);
    expect(cells).toHaveLength(26 * 7);
  });

  test('renders level 0 cells with bg-surface-dense class', () => {
    const html = renderHeatmap([]);
    const cells = getCellTags(html);
    const levelZeroCell = cells.find(
      (cell) => cell.includes('data-level="0"') && cell.includes('bg-surface-dense')
    );
    expect(levelZeroCell).toBeDefined();
  });

  test('renders a high-intensity class for days with 3+ completions', () => {
    const nowIso = new Date().toISOString();
    const html = renderHeatmap([nowIso, nowIso, nowIso]);
    const cells = getCellTags(html);
    const intenseCell = cells.find(
      (cell) =>
        cell.includes('data-count="3"') &&
        cell.includes('data-level="3"')
    );
    expect(intenseCell).toBeDefined();
  });

  test('shows empty-state helper copy when there is no completion data', () => {
    const html = renderHeatmap([]);
    expect(html).toContain('Complete articles to start building your streak.');
  });
});
