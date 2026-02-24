import { beforeEach, describe, expect, test, vi } from 'vitest';

interface SetupOptions {
  session: { user?: { email?: string } } | null;
  username: string | null;
}

async function setup({ session, username }: SetupOptions) {
  vi.resetModules();

  const redirectMock = vi.fn((target: string) => {
    throw new Error(`REDIRECT:${target}`);
  });

  const getServerSessionMock = vi.fn().mockResolvedValue(session);

  const singleMock = vi.fn().mockResolvedValue({
    data: username ? { username } : null,
  });
  const eqMock = vi.fn(() => ({ single: singleMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ select: selectMock }));

  vi.doMock('next/navigation', () => ({
    redirect: redirectMock,
  }));

  vi.doMock('next-auth', () => ({
    getServerSession: getServerSessionMock,
  }));

  vi.doMock('@/app/api/auth/[...nextauth]/auth', () => ({
    authOptions: {},
  }));

  vi.doMock('@/lib/supabase', () => ({
    supabase: {
      from: fromMock,
    },
  }));

  const mod = await import('./page');

  return {
    ProgressPage: mod.default,
    redirectMock,
    fromMock,
  };
}

describe('/learn/progress page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('redirects to / when user is not authenticated', async () => {
    const { ProgressPage, redirectMock, fromMock } = await setup({ session: null, username: null });

    await expect(ProgressPage()).rejects.toThrow('REDIRECT:/');
    expect(redirectMock).toHaveBeenCalledWith('/');
    expect(fromMock).not.toHaveBeenCalled();
  });

  test('redirects to /profile/:username when user has a username', async () => {
    const { ProgressPage, redirectMock } = await setup({
      session: { user: { email: 'alice@example.com' } },
      username: 'alice',
    });

    await expect(ProgressPage()).rejects.toThrow('REDIRECT:/profile/alice');
    expect(redirectMock).toHaveBeenCalledWith('/profile/alice');
  });

  test('redirects to / when authenticated user has no username', async () => {
    const { ProgressPage, redirectMock } = await setup({
      session: { user: { email: 'alice@example.com' } },
      username: null,
    });

    await expect(ProgressPage()).rejects.toThrow('REDIRECT:/');
    expect(redirectMock).toHaveBeenCalledWith('/');
  });
});
