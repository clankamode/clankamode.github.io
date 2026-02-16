import { describe, expect, it } from 'vitest';
import { buildFunnelByFirstItem, buildRepeatAnalysis, normalizeTelemetryHref } from '@/lib/session-recommendation-quality';

describe('session recommendation quality metrics', () => {
  it('normalizes href variants', () => {
    expect(normalizeTelemetryHref('/learn/dsa/x?sessionChunk=1#top')).toBe('/learn/dsa/x');
  });

  it('computes repeat rate with a rolling window per user', () => {
    const rows = [
      { userKey: 'u1', createdAt: '2026-02-10T10:00:00Z', href: '/learn/dsa/a', sessionId: 's1' },
      { userKey: 'u1', createdAt: '2026-02-11T10:00:00Z', href: '/learn/dsa/a', sessionId: 's2' },
      { userKey: 'u2', createdAt: '2026-02-11T10:00:00Z', href: '/learn/dsa/b', sessionId: 's3' },
    ];

    const result = buildRepeatAnalysis(rows, { lookbackDays: 7, alertThreshold: 0.2 });

    expect(result.daily.length).toBeGreaterThan(0);
    expect(result.itemRepeats.find((item) => item.href === '/learn/dsa/a')?.repeatedCount).toBe(1);
    expect(result.userDailyAlerts.length).toBe(1);
  });

  it('builds first-item funnel counts by session', () => {
    const committed = [
      { userKey: 'u1', createdAt: '2026-02-10T10:00:00Z', href: '/learn/dsa/a', sessionId: 's1' },
      { userKey: 'u1', createdAt: '2026-02-10T11:00:00Z', href: '/learn/dsa/a', sessionId: 's2' },
    ];
    const completed = [
      { sessionId: 's1', createdAt: '2026-02-10T10:02:00Z', href: '/learn/dsa/a' },
    ];
    const finalized = [
      { sessionId: 's1', createdAt: '2026-02-10T10:15:00Z' },
      { sessionId: 's2', createdAt: '2026-02-10T11:15:00Z' },
    ];

    const funnel = buildFunnelByFirstItem(committed, completed, finalized);
    expect(funnel[0]?.href).toBe('/learn/dsa/a');
    expect(funnel[0]?.committedSessions).toBe(2);
    expect(funnel[0]?.completedFirstItemSessions).toBe(1);
    expect(funnel[0]?.finalizedSessions).toBe(2);
  });
});
