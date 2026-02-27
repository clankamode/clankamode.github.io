import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabaseAdmin');
vi.mock('@/lib/progress', () => ({
  getSessionState: vi.fn().mockResolvedValue({}),
}));

import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getSessionState } from '@/lib/progress';
import { POST } from '@/app/api/session-plan-prebake/route';

function makeAdmin() {
  const single = vi.fn().mockResolvedValue({ data: null, error: null });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from };
}

function makeRequest(opts: {
  headers?: Record<string, string>;
  body?: object | null;
}) {
  const body = opts.body !== null ? JSON.stringify(opts.body ?? {}) : undefined;
  return new NextRequest('http://localhost/api/session-plan-prebake', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...opts.headers },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSupabaseAdminClient).mockReturnValue(makeAdmin() as unknown as ReturnType<typeof getSupabaseAdminClient>);
  vi.mocked(getSessionState).mockResolvedValue({} as Awaited<ReturnType<typeof getSessionState>>);
});

afterEach(() => {
  delete process.env.INTERNAL_SECRET;
});

describe('POST /api/session-plan-prebake', () => {
  it('returns 503 when INTERNAL_SECRET env var is not set', async () => {
    delete process.env.INTERNAL_SECRET;
    const req = makeRequest({ headers: { 'x-internal-secret': 'anything' }, body: { email: 'a@b.com', trackSlug: 'dsa' } });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json).toMatchObject({ error: expect.any(String) });
  });

  it('returns 401 when x-internal-secret header is missing', async () => {
    process.env.INTERNAL_SECRET = 'my-secret';
    const req = makeRequest({ body: { email: 'a@b.com', trackSlug: 'dsa' } });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when x-internal-secret header is wrong', async () => {
    process.env.INTERNAL_SECRET = 'my-secret';
    const req = makeRequest({ headers: { 'x-internal-secret': 'wrong-secret' }, body: { email: 'a@b.com', trackSlug: 'dsa' } });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is missing email', async () => {
    process.env.INTERNAL_SECRET = 'my-secret';
    const req = makeRequest({ headers: { 'x-internal-secret': 'my-secret' }, body: { trackSlug: 'dsa' } });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toMatchObject({ error: expect.any(String) });
  });

  it('returns 400 when body is missing trackSlug', async () => {
    process.env.INTERNAL_SECRET = 'my-secret';
    const req = makeRequest({ headers: { 'x-internal-secret': 'my-secret' }, body: { email: 'a@b.com' } });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 { ok: true } on valid request', async () => {
    process.env.INTERNAL_SECRET = 'my-secret';
    const req = makeRequest({ headers: { 'x-internal-secret': 'my-secret' }, body: { email: 'a@b.com', trackSlug: 'dsa' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(getSessionState).toHaveBeenCalledOnce();
    expect(getSessionState).toHaveBeenCalledWith('a@b.com', 'dsa', undefined, expect.any(Object));
  });
});
