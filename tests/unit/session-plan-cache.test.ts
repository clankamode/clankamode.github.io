import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getCachedSessionPlan, storeCachedSessionPlan } from '@/lib/session-plan-cache';
import type { SessionItem } from '@/lib/progress';

vi.mock('@/lib/supabaseAdmin');

const mockItems: SessionItem[] = [
  {
    type: 'learn',
    title: 'Arrays',
    subtitle: '5 min read',
    pillarSlug: 'dsa',
    href: '/learn/dsa/arrays',
    estMinutes: 5,
    intent: { type: 'foundation', text: 'Build array intuition.' },
  },
];

function makeMockAdmin(overrides: { single?: () => object; upsert?: () => object } = {}) {
  const single = vi.fn().mockResolvedValue(overrides.single ? overrides.single() : { data: null, error: null });
  const upsert = vi.fn().mockResolvedValue(overrides.upsert ? overrides.upsert() : { error: null });

  const eqChain = { single };
  const eq3 = vi.fn().mockReturnValue(eqChain);
  const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  const from = vi.fn().mockReturnValue({ select, upsert });

  return { admin: { from }, single, upsert, from };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCachedSessionPlan', () => {
  it('returns null when Supabase returns an error', async () => {
    const { admin } = makeMockAdmin({ single: () => ({ data: null, error: { message: 'DB error' } }) });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof getSupabaseAdminClient>);

    const result = await getCachedSessionPlan('user@example.com', 'dsa');
    expect(result).toBeNull();
  });

  it('returns null when no row is found', async () => {
    const { admin } = makeMockAdmin({ single: () => ({ data: null, error: null }) });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof getSupabaseAdminClient>);

    const result = await getCachedSessionPlan('user@example.com', 'dsa');
    expect(result).toBeNull();
  });

  it('returns parsed items array on cache hit', async () => {
    const { admin } = makeMockAdmin({ single: () => ({ data: { items: mockItems }, error: null }) });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof getSupabaseAdminClient>);

    const result = await getCachedSessionPlan('user@example.com', 'dsa');
    expect(result).toEqual(mockItems);
  });
});

describe('storeCachedSessionPlan', () => {
  it('calls upsert with correct shape (email, track_slug, day_key, items)', async () => {
    const { admin, from } = makeMockAdmin();
    vi.mocked(getSupabaseAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof getSupabaseAdminClient>);

    await storeCachedSessionPlan('user@example.com', 'dsa', mockItems);

    expect(from).toHaveBeenCalledWith('SessionPlanCache');
    const upsertMock = from.mock.results[0]?.value?.upsert as ReturnType<typeof vi.fn>;
    expect(upsertMock).toHaveBeenCalledOnce();
    const [upsertPayload, upsertOptions] = upsertMock.mock.calls[0];
    expect(upsertPayload).toMatchObject({
      email: 'user@example.com',
      track_slug: 'dsa',
      items: mockItems,
    });
    expect(typeof upsertPayload.day_key).toBe('string');
    expect(upsertPayload.day_key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(upsertOptions).toMatchObject({ onConflict: 'email,track_slug,day_key' });
  });

  it('silently succeeds even if Supabase returns an error', async () => {
    const { admin } = makeMockAdmin({ upsert: () => ({ error: { message: 'Upsert failed' } }) });
    vi.mocked(getSupabaseAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof getSupabaseAdminClient>);

    await expect(storeCachedSessionPlan('user@example.com', 'dsa', mockItems)).resolves.toBeUndefined();
  });
});
