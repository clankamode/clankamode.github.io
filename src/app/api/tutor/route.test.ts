import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  getTokenMock,
  getSupabaseAdminClientMock,
  getEffectiveIdentityFromTokenMock,
  isFeatureEnabledMock,
  openaiCreateMock,
} = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
  getSupabaseAdminClientMock: vi.fn(),
  getEffectiveIdentityFromTokenMock: vi.fn(),
  isFeatureEnabledMock: vi.fn(),
  openaiCreateMock: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class OpenAI {
    responses = {
      create: openaiCreateMock,
    };
  },
}));

vi.mock('next-auth/jwt', () => ({
  getToken: getTokenMock,
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}));

vi.mock('@/lib/auth-identity', () => ({
  getEffectiveIdentityFromToken: getEffectiveIdentityFromTokenMock,
}));

vi.mock('@/lib/flags', () => ({
  FeatureFlags: { AI_TUTOR: 'ai_tutor' },
  isFeatureEnabled: isFeatureEnabledMock,
}));

import { POST } from './route';

function makeAdmin() {
  const usersSingleMock = vi.fn().mockResolvedValue({
    data: { id: 42 },
    error: null,
  });
  const usersEqMock = vi.fn(() => ({ single: usersSingleMock }));
  const usersSelectMock = vi.fn(() => ({ eq: usersEqMock }));

  const requestEventsGteMock = vi.fn().mockResolvedValue({
    count: 21,
    error: null,
  });
  const requestEventsEqMock = vi.fn(() => ({ gte: requestEventsGteMock }));
  const requestEventsSelectMock = vi.fn(() => ({ eq: requestEventsEqMock }));
  const requestEventsInsertMock = vi.fn().mockResolvedValue({ error: null });

  const fromMock = vi.fn((table: string) => {
    if (table === 'Users') {
      return { select: usersSelectMock };
    }

    if (table === 'TutorRequestEvents') {
      return {
        insert: requestEventsInsertMock,
        select: requestEventsSelectMock,
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    admin: { from: fromMock },
    requestEventsInsertMock,
    requestEventsSelectMock,
  };
}

function makePracticeRequest(conversationId?: number) {
  return new NextRequest('http://localhost/api/tutor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Need a hint',
      conversationId,
      practiceContext: {
        questionName: 'Two Sum',
        questionPrompt: 'Find two numbers that add to target.',
        difficulty: 'easy',
        category: 'arrays',
        pattern: 'hash map',
        currentCode: 'def two_sum(nums, target): pass',
        testResults: [],
      },
    }),
  });
}

describe('/api/tutor POST rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTokenMock.mockResolvedValue({ role: 'USER' });
    getEffectiveIdentityFromTokenMock.mockReturnValue({ email: 'alice@example.com' });
    isFeatureEnabledMock.mockReturnValue(true);
  });

  test('counts each request even when it targets an existing conversation', async () => {
    const { admin, requestEventsInsertMock, requestEventsSelectMock } = makeAdmin();
    getSupabaseAdminClientMock.mockReturnValue(admin);

    const res = await POST(makePracticeRequest(123));

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'Rate limit exceeded' });
    expect(requestEventsInsertMock).toHaveBeenCalledWith({ user_id: 42 });
    expect(requestEventsSelectMock).toHaveBeenCalledWith('id', { count: 'exact', head: true });
    expect(openaiCreateMock).not.toHaveBeenCalled();
  });
});
