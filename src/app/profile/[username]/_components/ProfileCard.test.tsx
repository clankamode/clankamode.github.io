import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ProfileCard from './ProfileCard';

const useSessionMock = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('./EditProfileModal', () => ({
  default: () => null,
}));

const profile = {
  username: 'alice',
  bio: 'Builder',
  avatar_url: null,
  leetcode_url: null,
  codeforces_url: null,
  github_url: null,
};

describe('ProfileCard', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({ data: { user: { email: 'viewer@example.com' } } });
  });

  test('renders username', () => {
    const html = renderToStaticMarkup(<ProfileCard profile={profile} currentUserUsername={null} />);

    expect(html).toContain('@alice');
  });

  test('shows Edit Profile button when currentUserUsername matches profile.username', () => {
    const html = renderToStaticMarkup(<ProfileCard profile={profile} currentUserUsername="alice" />);

    expect(html).toContain('Edit Profile');
  });

  test('does not show Edit Profile button for other users', () => {
    const html = renderToStaticMarkup(<ProfileCard profile={profile} currentUserUsername="bob" />);

    expect(html).not.toContain('Edit Profile');
  });
});
