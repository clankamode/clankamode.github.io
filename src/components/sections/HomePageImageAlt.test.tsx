import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HeroSection from './HeroSection';
import VideoCard from '@/components/ui/VideoCard';
import Navbar from '@/components/layout/Navbar';

const {
  usePathnameMock,
  useRouterMock,
  useSessionMock,
  useSessionContextMock,
  signOutMock,
  isFeatureEnabledMock,
} = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
  useRouterMock: vi.fn(),
  useSessionMock: vi.fn(),
  useSessionContextMock: vi.fn(),
  signOutMock: vi.fn(),
  isFeatureEnabledMock: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const imgProps = { ...props } as React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean };
    delete imgProps.fill;
    return React.createElement('img', { ...imgProps, alt: props.alt ?? '' });
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => useRouterMock(),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
  signOut: signOutMock,
}));

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => useSessionContextMock(),
}));

vi.mock('@/lib/flags', () => ({
  FeatureFlags: {
    PROGRESS_TRACKING: 'PROGRESS_TRACKING',
    SESSION_MODE: 'SESSION_MODE',
  },
  isFeatureEnabled: (...args: unknown[]) => isFeatureEnabledMock(...args),
}));

vi.mock('@/types/roles', () => ({
  UserRole: {
    USER: 'user',
    EDITOR: 'editor',
    ADMIN: 'admin',
  },
  hasRole: () => false,
}));

vi.mock('../auth/AdminProxyControls', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...rest}>
      {children}
    </button>
  ),
}));

(globalThis as { React?: typeof React }).React = React;

describe('home page image alt text', () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
    useRouterMock.mockReset();
    useSessionMock.mockReset();
    useSessionContextMock.mockReset();
    isFeatureEnabledMock.mockReset();

    usePathnameMock.mockReturnValue('/');
    useRouterMock.mockReturnValue({ push: vi.fn() });
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
    useSessionContextMock.mockReturnValue({ resetToEntry: vi.fn() });
    isFeatureEnabledMock.mockReturnValue(false);
  });

  test('renders descriptive alt text for the hero profile image', () => {
    const html = renderToStaticMarkup(
      <HeroSection
        channelStats={{
          id: 'channel-1',
          title: 'James Peralta',
          description: 'Interview prep channel',
          subscriberCount: '200000',
          videoCount: '100',
          viewCount: '1000000',
          thumbnailUrl: 'https://example.com/profile.jpg',
        }}
      />
    );

    expect(html).toContain('alt="James Peralta profile photo"');
  });

  test('renders descriptive alt text for video thumbnails', () => {
    const html = renderToStaticMarkup(
      <VideoCard
        title="Binary Search Interview Walkthrough"
        description="Deep dive"
        thumbnailUrl="https://example.com/thumb.jpg"
        videoUrl="https://youtube.com/watch?v=123"
        date="2026-03-01T00:00:00.000Z"
        viewCount="1200"
      />
    );

    expect(html).toContain('alt="YouTube video thumbnail for Binary Search Interview Walkthrough"');
  });

  test('renders descriptive alt text for the logged-out navbar logo', () => {
    const html = renderToStaticMarkup(<Navbar />);

    expect(html).toContain('alt="James Peralta logo"');
  });
});
