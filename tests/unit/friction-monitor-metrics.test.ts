import { describe, expect, it } from 'vitest';
import { buildFrictionMonitorMetrics } from '@/lib/friction-monitor';

describe('friction monitor metrics', () => {
  it('computes distribution, alerts, and hotspots', () => {
    const metrics = buildFrictionMonitorMetrics([
      {
        createdAt: '2026-02-15T10:00:00Z',
        trackSlug: 'dsa',
        stepIndex: 0,
        frictionState: 'stuck',
        trigger: 'state_change',
        confidence: 0.8,
      },
      {
        createdAt: '2026-02-15T10:05:00Z',
        trackSlug: 'dsa',
        stepIndex: 0,
        frictionState: 'stuck',
        trigger: 'step_exit',
        confidence: 0.72,
      },
      {
        createdAt: '2026-02-15T10:08:00Z',
        trackSlug: 'dsa',
        stepIndex: 0,
        frictionState: 'flow',
        trigger: 'step_exit',
        confidence: 0.9,
      },
      {
        createdAt: '2026-02-16T10:00:00Z',
        trackSlug: 'dsa',
        stepIndex: 1,
        frictionState: 'flow',
        trigger: 'step_exit',
        confidence: 0.65,
      },
    ], { alertThreshold: 0.3, hotspotMinSamples: 3 });

    expect(metrics.totalSnapshots).toBe(4);
    expect(metrics.stateDistribution.find((row) => row.state === 'stuck')?.count).toBe(2);
    expect(metrics.triggerDistribution.find((row) => row.trigger === 'step_exit')?.count).toBe(3);
    expect(metrics.dailyAlerts.length).toBeGreaterThan(0);
    expect(metrics.hotspots[0]?.trackSlug).toBe('dsa');
    expect(metrics.hotspots[0]?.stepIndex).toBe(0);
    expect(metrics.hotspots[0]?.stuckRate).toBeCloseTo(2 / 3, 4);
  });
});
