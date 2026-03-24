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

import { GET, POST } from './route';

function makeGetAdmin(params?: {
  peraltaQuestions?: Array<{ id: string; leetcode_number: number }>;
  progressRows?: Array<{
    problem_id: string;
    leetcode_number: number;
    status: 'attempted' | 'solved';
    attempted_at: string | null;
    solved_at: string | null;
  }>;
}) {
  const peraltaQuestions = params?.peraltaQuestions ?? [{ id: 'q1', leetcode_number: 1 }];
  const progressRows = params?.progressRows ?? [
    {
      problem_id: 'q1',
      leetcode_number: 1,
      status: 'solved' as const,
      attempted_at: '2026-01-01T00:00:00.000Z',
      solved_at: '2026-01-02T00:00:00.000Z',
    },
  ];

  const questionNotMock = vi.fn().mockResolvedValue({ data: peraltaQuestions, error: null });
  const questionContainsMock = vi.fn(() => ({ not: questionNotMock }));
  const questionSelectMock = vi.fn(() => ({ contains: questionContainsMock }));

  const progressOrderMock = vi.fn().mockResolvedValue({ data: progressRows, error: null });
  const progressInMock = vi.fn(() => ({ order: progressOrderMock }));
  const progressOrMock = vi.fn(() => ({ in: progressInMock }));
  const progressSelectMock = vi.fn(() => ({ or: progressOrMock }));

  const fromMock = vi.fn((table: string) => {
    if (table === 'InterviewQuestions') {
      return { select: questionSelectMock };
    }

    return { select: progressSelectMock };
  });

  return {
    admin: { from: fromMock },
    fromMock,
  };
}

function makePostAdmin(params?: {
  questionRows?: Array<{ id: string; leetcode_number: number; source: string[] }>;
  existingRows?: Array<{ problem_id: string; attempted_at: string | null; solved_at: string | null }>;
}) {
  const questionRows = params?.questionRows ?? [{ id: 'q1', leetcode_number: 1, source: ['PERALTA_75'] }];
  const existingRows = params?.existingRows ?? [];

  const questionContainsMock = vi.fn().mockResolvedValue({ data: questionRows, error: null });
  const questionInMock = vi.fn(() => ({ contains: questionContainsMock }));
  const questionSelectMock = vi.fn(() => ({ in: questionInMock }));

  const existingInMock = vi.fn().mockResolvedValue({ data: existingRows, error: null });
  const existingOrMock = vi.fn(() => ({ in: existingInMock }));
  const existingSelectMock = vi.fn(() => ({ or: existingOrMock }));

  const upsertMock = vi.fn().mockResolvedValue({ error: null });

  let progressTableCalls = 0;
  const fromMock = vi.fn((table: string) => {
    if (table === 'InterviewQuestions') {
      return { select: questionSelectMock };
    }

    progressTableCalls += 1;
    if (progressTableCalls === 1) {
      return { select: existingSelectMock };
    }

    return { upsert: upsertMock };
  });

  return {
    admin: { from: fromMock },
    upsertMock,
  };
}

describe('/api/peralta75/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('GET returns 401 if no token', async () => {
    getTokenMock.mockResolvedValue(null);

    const res = await GET(new NextRequest('http://localhost/api/peralta75/progress'));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  test('GET returns 400 if token has no identity', async () => {
    getTokenMock.mockResolvedValue({});

    const res = await GET(new NextRequest('http://localhost/api/peralta75/progress'));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing identity' });
  });

  test.each([
    { label: 'regular user', role: 'USER' },
    { label: 'INSIDER', role: 'INSIDER' },
    { label: 'ADMIN', role: 'ADMIN' },
  ])('GET returns progress for authenticated $label (never 403)', async ({ role }) => {
    const { admin } = makeGetAdmin();
    getTokenMock.mockResolvedValue({ email: 'alice@example.com', id: 'gid-1', role });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await GET(new NextRequest('http://localhost/api/peralta75/progress'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      progress: {
        '1': {
          status: 'solved',
          attemptedAt: '2026-01-01T00:00:00.000Z',
          solvedAt: '2026-01-02T00:00:00.000Z',
        },
      },
    });
  });

  test('GET returns empty progress if no matching questions', async () => {
    const { admin, fromMock } = makeGetAdmin({ peraltaQuestions: [] });
    getTokenMock.mockResolvedValue({ email: 'alice@example.com', id: 'gid-1' });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await GET(new NextRequest('http://localhost/api/peralta75/progress'));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ progress: {} });
    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith('InterviewQuestions');
  });

  test('POST returns 401 if no token', async () => {
    getTokenMock.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/peralta75/progress', {
      method: 'POST',
      body: JSON.stringify({ updates: [{ leetcodeNumber: 1, status: 'solved', origin: 'manual' }] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  test('POST returns 400 if token has no identity', async () => {
    getTokenMock.mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/peralta75/progress', {
      method: 'POST',
      body: JSON.stringify({ updates: [{ leetcodeNumber: 1, status: 'solved', origin: 'manual' }] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing identity' });
  });

  test.each([
    { label: 'regular user', role: 'USER' },
    { label: 'INSIDER', role: 'INSIDER' },
    { label: 'ADMIN', role: 'ADMIN' },
  ])('POST saves progress for authenticated $label (never 403)', async ({ role }) => {
    const { admin, upsertMock } = makePostAdmin();
    getTokenMock.mockResolvedValue({ email: 'alice@example.com', id: 'gid-1', role });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const req = new NextRequest('http://localhost/api/peralta75/progress', {
      method: 'POST',
      body: JSON.stringify({ updates: [{ leetcodeNumber: 1, status: 'solved', origin: 'execution' }] }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.updated).toBe(1);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'alice@example.com',
          google_id: 'gid-1',
          problem_id: 'q1',
          leetcode_number: 1,
          status: 'solved',
        }),
      ]),
      { onConflict: 'google_id,problem_id' }
    );
  });

  test('POST falls back to email conflict target for legacy email-only users', async () => {
    const { admin, upsertMock } = makePostAdmin();
    getTokenMock.mockResolvedValue({ email: 'alice@example.com' });
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const req = new NextRequest('http://localhost/api/peralta75/progress', {
      method: 'POST',
      body: JSON.stringify({ updates: [{ leetcodeNumber: 1, status: 'attempted', origin: 'execution' }] }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.updated).toBe(1);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'alice@example.com',
          google_id: null,
          problem_id: 'q1',
          leetcode_number: 1,
          status: 'attempted',
        }),
      ]),
      { onConflict: 'email,problem_id' }
    );
  });

  test('POST returns 400 if no valid updates', async () => {
    getTokenMock.mockResolvedValue({ email: 'alice@example.com', id: 'gid-1' });

    const req = new NextRequest('http://localhost/api/peralta75/progress', {
      method: 'POST',
      body: JSON.stringify({ updates: [{ leetcodeNumber: 1, status: 'bad-status', origin: 'manual' }] }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'No valid updates provided' });
    expect(getSupabaseAdminClientMock).not.toHaveBeenCalled();
  });
});
