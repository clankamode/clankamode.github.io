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

import { PATCH } from './route';

function makeAdminPatchResult(result: { data?: Record<string, unknown>; error?: { code?: string } | null }) {
  const singleMock = vi.fn().mockResolvedValue({
    data: result.data ?? null,
    error: result.error ?? null,
  });
  const selectMock = vi.fn(() => ({ single: singleMock }));
  const eqMock = vi.fn(() => ({ select: selectMock }));
  const updateMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ update: updateMock }));

  return {
    admin: { from: fromMock },
    fromMock,
    updateMock,
    eqMock,
  };
}

function makeAdminPatchResultSequence(results: Array<{ data?: Record<string, unknown>; error?: { code?: string; message?: string } | null }>) {
  const queue = [...results];
  const updateMock = vi.fn(() => {
    const current = queue.shift();
    if (!current) {
      throw new Error('Unexpected update call');
    }
    const singleMock = vi.fn().mockResolvedValue({
      data: current.data ?? null,
      error: current.error ?? null,
    });
    const selectMock = vi.fn(() => ({ single: singleMock }));
    const eqMock = vi.fn(() => ({ select: selectMock }));
    return { eq: eqMock };
  });
  const fromMock = vi.fn(() => ({ update: updateMock }));

  return {
    admin: { from: fromMock },
    fromMock,
    updateMock,
  };
}

function makePatchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/feedback/feedback-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('/api/admin/feedback/[id] PATCH', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.each(['resolved', 'wont_fix', 'duplicate', 'not_a_bug'] as const)(
    'returns success for closed status with valid resolution: %s',
    async (resolution) => {
      const { admin, updateMock, eqMock } = makeAdminPatchResult({
        data: {
          id: 'feedback-1',
          status: 'closed',
          resolution,
          created_at: '2026-02-25T10:00:00.000Z',
          category: 'bug',
          message: 'Issue',
          page_path: '/learn',
          contact_email: null,
          user_email: 'alice@example.com',
        },
      });

      getTokenMock.mockResolvedValue({ role: 'ADMIN' });
      getSupabaseAdminClientMock.mockReturnValue(admin);

      const res = await PATCH(makePatchRequest({ status: 'closed', resolution }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        id: 'feedback-1',
        status: 'closed',
        resolution,
        isOpen: false,
      });
      expect(updateMock).toHaveBeenCalledWith({ status: 'closed', resolution });
      expect(eqMock).toHaveBeenCalledWith('id', 'feedback-1');
    }
  );

  test('returns 400 for invalid resolution', async () => {
    getTokenMock.mockResolvedValue({ role: 'ADMIN' });

    const res = await PATCH(makePatchRequest({ status: 'closed', resolution: 'invalid' }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'resolution must be one of: resolved, wont_fix, duplicate, not_a_bug',
    });
    expect(getSupabaseAdminClientMock).not.toHaveBeenCalled();
  });

  test('allows closing without resolution (resolution optional)', async () => {
    const { admin, updateMock } = makeAdminPatchResult({
      data: {
        id: 'feedback-1',
        status: 'closed',
        resolution: null,
        created_at: '2026-02-25T10:00:00.000Z',
        category: 'bug',
        message: 'Issue',
        page_path: '/learn',
        contact_email: null,
        user_email: 'alice@example.com',
      },
    });

    getTokenMock.mockResolvedValue({ role: 'ADMIN' });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await PATCH(makePatchRequest({ status: 'closed' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ status: 'closed', resolution: null, isOpen: false });
    expect(updateMock).toHaveBeenCalledWith({ status: 'closed', resolution: null });
  });

  test('reopening clears resolution', async () => {
    const { admin, updateMock } = makeAdminPatchResult({
      data: {
        id: 'feedback-1',
        status: 'new',
        resolution: null,
        created_at: '2026-02-25T10:00:00.000Z',
        category: 'bug',
        message: 'Issue',
        page_path: '/learn',
        contact_email: null,
        user_email: 'alice@example.com',
      },
    });

    getTokenMock.mockResolvedValue({ role: 'ADMIN' });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await PATCH(makePatchRequest({ status: 'open', resolution: null }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ status: 'new', resolution: null, isOpen: true });
    expect(updateMock).toHaveBeenCalledWith({ status: 'new', resolution: null });
  });

  test('ignores provided resolution when reopening', async () => {
    const { admin, updateMock } = makeAdminPatchResult({
      data: {
        id: 'feedback-1',
        status: 'new',
        resolution: null,
        created_at: '2026-02-25T10:00:00.000Z',
        category: 'bug',
        message: 'Issue',
        page_path: '/learn',
        contact_email: null,
        user_email: 'alice@example.com',
      },
    });

    getTokenMock.mockResolvedValue({ role: 'ADMIN' });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await PATCH(makePatchRequest({ status: 'open', resolution: 'duplicate' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ status: 'new', resolution: null, isOpen: true });
    expect(updateMock).toHaveBeenCalledWith({ status: 'new', resolution: null });
  });

  test('falls back when resolution column is missing', async () => {
    const { admin, updateMock } = makeAdminPatchResultSequence([
      {
        error: { message: 'column "resolution" does not exist' },
      },
      {
        data: {
          id: 'feedback-1',
          status: 'closed',
          created_at: '2026-02-25T10:00:00.000Z',
          category: 'bug',
          message: 'Issue',
          page_path: '/learn',
          contact_email: null,
          user_email: 'alice@example.com',
        },
      },
    ]);

    getTokenMock.mockResolvedValue({ role: 'ADMIN' });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await PATCH(makePatchRequest({ status: 'closed', resolution: 'duplicate' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ status: 'closed', resolution: null, isOpen: false });
    expect(updateMock).toHaveBeenNthCalledWith(1, { status: 'closed', resolution: 'duplicate' });
    expect(updateMock).toHaveBeenNthCalledWith(2, { status: 'closed' });
  });

  test('returns 403 for non-admin users', async () => {
    getTokenMock.mockResolvedValue({ role: 'USER' });

    const res = await PATCH(makePatchRequest({ status: 'closed', resolution: 'resolved' }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Forbidden' });
    expect(getSupabaseAdminClientMock).not.toHaveBeenCalled();
  });
});
