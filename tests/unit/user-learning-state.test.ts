import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

vi.mock('@/lib/supabaseAdmin');

function makeAdminWithNoInternalizations() {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  const userConceptStatsQuery: {
    or: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
  } = {
    or: vi.fn(),
    eq: vi.fn(),
  };
  userConceptStatsQuery.or.mockReturnValue(userConceptStatsQuery);
  userConceptStatsQuery.eq.mockResolvedValue({ data: [], error: null });

  const userInternalizationsQuery: {
    or: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  } = {
    or: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  userInternalizationsQuery.or.mockReturnValue(userInternalizationsQuery);
  userInternalizationsQuery.eq.mockReturnValue(userInternalizationsQuery);
  userInternalizationsQuery.order.mockReturnValue(userInternalizationsQuery);
  userInternalizationsQuery.limit.mockReturnValue({ maybeSingle });

  const telemetryQuery: {
    or: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  } = {
    or: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  telemetryQuery.or.mockReturnValue(telemetryQuery);
  telemetryQuery.eq.mockReturnValue(telemetryQuery);
  telemetryQuery.order.mockReturnValue(telemetryQuery);
  telemetryQuery.limit.mockResolvedValue({ data: [], error: null });

  const from = vi.fn((table: string) => {
    if (table === 'UserConceptStats') {
      return { select: vi.fn().mockReturnValue(userConceptStatsQuery) };
    }
    if (table === 'UserInternalizations') {
      return { select: vi.fn().mockReturnValue(userInternalizationsQuery) };
    }
    if (table === 'TelemetryEvents') {
      return { select: vi.fn().mockReturnValue(telemetryQuery) };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    admin: { from },
    maybeSingle,
  };
}

describe('getUserLearningState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('treats missing internalizations as null without error', async () => {
    const { admin, maybeSingle } = makeAdminWithNoInternalizations();
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      admin as unknown as ReturnType<typeof getSupabaseAdminClient>
    );

    const { getUserLearningState } = await import('@/lib/user-learning-state');
    const result = await getUserLearningState('clankamode@gmail.com', 'dsa', 'dev:clankamode@gmail.com');

    expect(maybeSingle).toHaveBeenCalledOnce();
    expect(result.debugInfo.hasLastInternalization).toBe(false);
    expect(result.userState.lastInternalization).toBeUndefined();
  });
});
