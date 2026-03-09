import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import Navbar, { getNavigationAriaLabel } from './Navbar';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/learn',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signOut: vi.fn(),
}));

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({ resetToEntry: vi.fn() }),
}));

vi.mock('@/lib/flags', () => ({
  FeatureFlags: {
    PROGRESS_TRACKING: 'PROGRESS_TRACKING',
    SESSION_MODE: 'SESSION_MODE',
  },
  isFeatureEnabled: () => false,
}));

vi.mock('../auth/AdminProxyControls', () => ({
  default: () => null,
}));

describe('Navbar', () => {
  test('builds descriptive aria labels for navigation links', () => {
    expect(getNavigationAriaLabel('Questions')).toBe('Navigate to Questions');
  });

  test('renders primary navigation links with descriptive aria labels', () => {
    const html = renderToStaticMarkup(<Navbar />);

    expect(html).toContain('aria-label="Main navigation"');
    expect(html).toContain(`aria-label="${getNavigationAriaLabel('Learn')}"`);
    expect(html).toContain(`aria-label="${getNavigationAriaLabel('Peralta 75')}"`);
    expect(html).toContain(`aria-label="${getNavigationAriaLabel('Assessment')}"`);
    expect(html).toContain(`aria-label="${getNavigationAriaLabel('Videos')}"`);
  });
});
