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

import { GET } from './route';

interface QueryResult {
  data?: Array<Record<string, unknown>> | null;
  error?: { message?: string } | null;
  count?: number | null;
}

interface QueryChain extends PromiseLike<QueryResult> {
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
}

function makeQueryChain(result: QueryResult): QueryChain {
  const resolved: QueryResult = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? null,
  };
  const promise = Promise.resolve(resolved);
  const chain = {} as QueryChain;
  chain.order = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.then = promise.then.bind(promise);
  return chain;
}

function makeAdminListResult(results: QueryResult[]) {
  const queue = [...results];
  const selectMock = vi.fn(() => {
    const next = queue.shift();
    if (!next) {
      throw new Error('Unexpected select call');
    }
    return makeQueryChain(next);
  });
  const fromMock = vi.fn(() => ({ select: selectMock }));

  return {
    admin: { from: fromMock },
    fromMock,
    selectMock,
  };
}

function makeGetRequest(params = 'page=1&limit=20&status=open&category=all') {
  return new NextRequest(`http://localhost/api/admin/feedback?${params}`);
}

describe('/api/admin/feedback GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns list for admin users', async () => {
    const { admin, fromMock, selectMock } = makeAdminListResult([
      {
        data: [
          {
            id: 'feedback-1',
            created_at: '2026-03-04T10:00:00.000Z',
            category: 'bug',
            message: 'There is a rendering issue in the editor.',
            page_path: '/learn/arrays',
            contact_email: null,
            user_email: 'alice@example.com',
            status: 'new',
            resolution: null,
            metadata: {},
          },
        ],
        count: 1,
      },
    ]);

    getTokenMock.mockResolvedValue({ role: 'ADMIN' });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await GET(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith('UserFeedback');
    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(body).toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
      feedback: [
        {
          id: 'feedback-1',
          status: 'new',
          resolution: null,
          isOpen: true,
        },
      ],
    });
  });

  test('falls back when resolution column is missing', async () => {
    const { admin, selectMock } = makeAdminListResult([
      {
        error: { message: 'column "resolution" does not exist' },
      },
      {
        data: [
          {
            id: 'feedback-2',
            created_at: '2026-03-04T12:00:00.000Z',
            category: 'idea',
            message: 'Please add keyboard shortcuts for navigation.',
            page_path: '/learn/hashmaps',
            contact_email: 'reader@example.com',
            user_email: null,
            status: 'closed',
            metadata: {},
          },
        ],
        count: 1,
      },
    ]);

    getTokenMock.mockResolvedValue({ role: 'ADMIN' });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await GET(makeGetRequest('page=1&limit=20&status=all&category=all'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(selectMock).toHaveBeenCalledTimes(2);
    expect(selectMock).toHaveBeenNthCalledWith(1, expect.stringContaining('resolution'), { count: 'exact' });
    expect(selectMock).toHaveBeenNthCalledWith(2, expect.not.stringContaining('resolution'), { count: 'exact' });

    expect(body.feedback).toHaveLength(1);
    expect(body.feedback[0]).toMatchObject({
      id: 'feedback-2',
      status: 'closed',
      resolution: null,
      isOpen: false,
    });
  });

  test('returns 403 for non-admin users', async () => {
    getTokenMock.mockResolvedValue({ role: 'USER' });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Forbidden' });
    expect(getSupabaseAdminClientMock).not.toHaveBeenCalled();
  });
});
