import { describe, expect, it } from 'vitest';
import { buildFrictionDedupeKey, normalizeFrictionSnapshotPayload } from '@/lib/friction-snapshot';

describe('friction payload shape', () => {
  it('builds deterministic dedupe keys', () => {
    const key = buildFrictionDedupeKey({
      sessionId: 's-123',
      stepIndex: 2,
      trigger: 'state_change',
      frictionState: 'drift',
    });

    expect(key).toBe('s-123:2:state_change:drift');
  });

  it('normalizes and clamps payload values', () => {
    const payload = normalizeFrictionSnapshotPayload({
      sessionId: 'abc',
      trackSlug: 'dsa',
      stepIndex: 4,
      frictionState: 'stuck',
      confidence: 1.8,
      trigger: 'step_exit',
      signals: {
        stepIndex: 4,
        elapsedMs: 120_000,
        estimatedMs: 60_000,
        chunkNextCount: 1,
        chunkPrevCount: 3,
        drawerToggleCount: 0,
        practiceBlockedCount: 2,
        meaningfulActionCount: 1,
        secondsSinceLastInteraction: 130,
        cadenceDrop: true,
      },
    });

    expect(payload.phase).toBe('execution');
    expect(payload.confidence).toBe(1);
    expect(payload.dedupeKey).toBe('abc:4:step_exit:stuck');
  });
});
