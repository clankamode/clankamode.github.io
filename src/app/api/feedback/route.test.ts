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

import { POST } from './route';

function makeAdminInsertResult(params?: { error?: { message: string } | null }) {
  const insertMock = vi.fn().mockResolvedValue({ error: params?.error ?? null });
  const fromMock = vi.fn(() => ({ insert: insertMock }));

  return {
    admin: { from: fromMock },
    fromMock,
    insertMock,
  };
}

function makeRequest(body: Record<string, unknown>, ip: string) {
  return new NextRequest('http://localhost/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('/api/feedback POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('stores page helpfulness vote in page_feedback table', async () => {
    const { admin, fromMock, insertMock } = makeAdminInsertResult();
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const req = makeRequest({ pageSlug: '/learn/arrays/two-sum', helpful: true }, '10.0.0.1');
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(fromMock).toHaveBeenCalledWith('page_feedback');
    expect(insertMock).toHaveBeenCalledWith({
      page_slug: '/learn/arrays/two-sum',
      helpful: true,
    });
    expect(getTokenMock).not.toHaveBeenCalled();
  });

  test('returns 400 for invalid page helpfulness payload', async () => {
    const req = makeRequest({ pageSlug: '/learn/arrays/two-sum', helpful: 'yes' }, '10.0.0.2');
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Helpful must be a boolean.' });
    expect(getSupabaseAdminClientMock).not.toHaveBeenCalled();
  });

  test('returns 500 when page helpfulness insert fails', async () => {
    const { admin } = makeAdminInsertResult({ error: { message: 'db error' } });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const req = makeRequest({ pageSlug: '/learn/arrays/two-sum', helpful: false }, '10.0.0.3');
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Could not save feedback.' });
  });

  test('stores long-form feedback in UserFeedback table', async () => {
    const { admin, fromMock, insertMock } = makeAdminInsertResult();
    getSupabaseAdminClientMock.mockReturnValue(admin);
    getTokenMock.mockResolvedValue({
      email: 'alice@example.com',
      id: 'gid-1',
    });

    const req = makeRequest(
      {
        category: 'idea',
        message: 'This page could use one more dynamic programming example.',
        pagePath: '/learn/dynamic-programming/knapsack',
        pageUrl: 'https://jamesperalta.com/learn/dynamic-programming/knapsack',
        contactEmail: 'alice@example.com',
        attachmentUrls: [{ url: 'https://example.com/screenshot.png', name: 'screenshot' }],
      },
      '10.0.0.4'
    );

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(fromMock).toHaveBeenCalledWith('UserFeedback');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'idea',
        message: 'This page could use one more dynamic programming example.',
        page_path: '/learn/dynamic-programming/knapsack',
        contact_email: 'alice@example.com',
        user_email: 'alice@example.com',
        google_id: 'gid-1',
      })
    );
  });

  test('returns 400 for invalid long-form payload', async () => {
    const req = makeRequest(
      {
        category: 'idea',
        message: 'short',
      },
      '10.0.0.5'
    );

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Feedback message must be at least 10 characters.' });
    expect(getSupabaseAdminClientMock).not.toHaveBeenCalled();
  });
});
