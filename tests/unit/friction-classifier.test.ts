import { describe, expect, it } from 'vitest';
import { classifyFriction } from '@/lib/friction-classifier';
import type { FrictionSignalVector } from '@/types/friction';

function vector(overrides: Partial<FrictionSignalVector> = {}): FrictionSignalVector {
  return {
    stepIndex: 0,
    elapsedMs: 8 * 60_000,
    estimatedMs: 5 * 60_000,
    chunkNextCount: 2,
    chunkPrevCount: 1,
    drawerToggleCount: 0,
    practiceBlockedCount: 0,
    meaningfulActionCount: 3,
    secondsSinceLastInteraction: 20,
    cadenceDrop: false,
    ...overrides,
  };
}

describe('friction classifier', () => {
  it('classifies stuck for repeated blockers', () => {
    const result = classifyFriction(vector({ practiceBlockedCount: 2, meaningfulActionCount: 1 }));
    expect(result.state).toBe('stuck');
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('classifies stuck for oscillation with low progression', () => {
    const result = classifyFriction(vector({ chunkNextCount: 5, chunkPrevCount: 4, meaningfulActionCount: 1 }));
    expect(result.state).toBe('stuck');
  });

  it('classifies drift for prolonged elapsed mismatch', () => {
    const result = classifyFriction(vector({ elapsedMs: 10 * 60_000, estimatedMs: 5 * 60_000, meaningfulActionCount: 1 }));
    expect(result.state).toBe('drift');
  });

  it('classifies fatigue for high elapsed ratio and cadence drop', () => {
    const result = classifyFriction(vector({ elapsedMs: 15 * 60_000, estimatedMs: 5 * 60_000, secondsSinceLastInteraction: 160, cadenceDrop: true }));
    expect(result.state).toBe('fatigue');
  });

  it('classifies coast for fast progress and no blockers', () => {
    const result = classifyFriction(vector({ elapsedMs: 2 * 60_000, estimatedMs: 6 * 60_000, meaningfulActionCount: 4, practiceBlockedCount: 0 }));
    expect(result.state).toBe('coast');
  });

  it('clamps confidence in [0, 1]', () => {
    const result = classifyFriction(vector({ practiceBlockedCount: 4, chunkNextCount: 12, chunkPrevCount: 4, meaningfulActionCount: 0 }));
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('is deterministic for fixed vectors', () => {
    const input = vector({ elapsedMs: 7 * 60_000, estimatedMs: 5 * 60_000, meaningfulActionCount: 2 });
    const a = classifyFriction(input);
    const b = classifyFriction(input);
    expect(a).toEqual(b);
  });
});
