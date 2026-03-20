import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getTokenMock, getSupabaseAdminClientMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
  getSupabaseAdminClientMock: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}));

async function loadRouteModule() {
  return import('./route');
}

function makeAdmin() {
  const upsertMock = vi.fn().mockResolvedValue({ error: null });

  return {
    admin: {
      from: vi.fn(() => ({
        upsert: upsertMock,
      })),
    },
    upsertMock,
  };
}

describe('/api/progress/complete POST', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_ENABLE_PROGRESS', 'true');
  });

  test('dedupes repeated requests for the same user and idempotency key', async () => {
    const { POST } = await loadRouteModule();
    const { admin, upsertMock } = makeAdmin();
    getSupabaseAdminClientMock.mockReturnValue(admin);
    getTokenMock.mockResolvedValue({ email: 'alice@example.com', id: 'gid-alice', role: 'ADMIN' });

    const request = () =>
      new NextRequest('http://localhost/api/progress/complete', {
        method: 'POST',
        headers: { 'x-idempotency-key': 'session-1:article-1:complete', 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: 'article-1' }),
      });

    const first = await POST(request());
    const second = await POST(request());

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ completed: true });
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ completed: true, deduped: true });
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });

  test('does not dedupe two different users that share the same idempotency key', async () => {
    const { POST } = await loadRouteModule();
    const { admin, upsertMock } = makeAdmin();
    getSupabaseAdminClientMock.mockReturnValue(admin);
    getTokenMock
      .mockResolvedValueOnce({ email: 'alice@example.com', id: 'gid-alice', role: 'ADMIN' })
      .mockResolvedValueOnce({ email: 'bob@example.com', id: 'gid-bob', role: 'ADMIN' });

    const request = () =>
      new NextRequest('http://localhost/api/progress/complete', {
        method: 'POST',
        headers: { 'x-idempotency-key': 'session-1:article-1:complete', 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: 'article-1' }),
      });

    const first = await POST(request());
    const second = await POST(request());

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ completed: true });
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ completed: true });
    expect(upsertMock).toHaveBeenCalledTimes(2);
  });
});
