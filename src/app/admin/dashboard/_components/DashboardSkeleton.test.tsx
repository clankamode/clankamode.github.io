import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import DashboardSkeleton, { UsersTableSkeleton } from './DashboardSkeleton';

describe('DashboardSkeleton', () => {
  test('renders the dashboard loading layout', () => {
    const html = renderToStaticMarkup(<DashboardSkeleton />);

    expect(html).toContain('Dashboard');
    expect(html).toContain('Statistics');
    expect(html).toContain('Users');
  });

  test('renders the users table skeleton headings', () => {
    const html = renderToStaticMarkup(<UsersTableSkeleton />);

    expect(html).toContain('Email');
    expect(html).toContain('Username');
    expect(html).toContain('Created');
  });
});
