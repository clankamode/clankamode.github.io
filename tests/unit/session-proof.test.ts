import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLast7Proof } from '@/lib/progress/session-proof';

describe('session-proof helper', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds a separate daily goal payload from completion history', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:00:00.000Z'));

    const proof = buildLast7Proof([
      '2026-03-08T05:00:00.000Z',
      '2026-03-08T13:00:00.000Z',
      '2026-03-07T09:00:00.000Z',
    ], 2);

    expect(proof.todayCount).toBe(2);
    expect(proof.dailyGoal).toEqual({
      target: 2,
      completed: 2,
      remaining: 0,
      met: true,
    });
  });
});
