import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import AppShell, { MAIN_CONTENT_ID } from './AppShell';

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('@/hooks/useChromeMode', () => ({
  useChromeVisibility: () => ({
    mode: 'app',
    showNavbar: false,
    showFooter: false,
    showFeedbackWidget: false,
  }),
}));

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({ state: null }),
}));

vi.mock('./Navbar', () => ({
  default: () => <nav />,
}));

vi.mock('./Footer', () => ({
  default: () => <footer />,
}));

describe('AppShell', () => {
  test('renders the main content target for skip links', () => {
    const html = renderToStaticMarkup(
      <AppShell>
        <div>content</div>
      </AppShell>
    );

    expect(html).toContain(`id="${MAIN_CONTENT_ID}"`);
    expect(html).toContain('tabindex="-1"');
  });
});
