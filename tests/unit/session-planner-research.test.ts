import { describe, it, expect } from 'vitest';
import {
  daysSinceLastSeen,
  minDaysUntilReview,
  difficultyMultiplier,
} from '@/lib/session-llm-planner';

describe('daysSinceLastSeen', () => {
  it('returns Infinity for null', () => {
    expect(daysSinceLastSeen(null)).toBe(Infinity);
  });

  it('returns approximately correct days for a recent date', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = daysSinceLastSeen(oneDayAgo);
    expect(result).toBeGreaterThan(0.9);
    expect(result).toBeLessThan(1.1);
  });

  it('returns approximately correct days for an older date', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const result = daysSinceLastSeen(fiveDaysAgo);
    expect(result).toBeGreaterThan(4.9);
    expect(result).toBeLessThan(5.1);
  });
});

describe('minDaysUntilReview', () => {
  it('returns 2 for exposure count 1', () => {
    expect(minDaysUntilReview(1)).toBe(2);
  });

  it('returns 2 for exposure count 2', () => {
    expect(minDaysUntilReview(2)).toBe(2);
  });

  it('returns 3 for exposure count 3', () => {
    expect(minDaysUntilReview(3)).toBe(3);
  });

  it('returns 3 for exposure count 5', () => {
    expect(minDaysUntilReview(5)).toBe(3);
  });

  it('returns 5 for exposure count 6+', () => {
    expect(minDaysUntilReview(6)).toBe(5);
    expect(minDaysUntilReview(10)).toBe(5);
  });
});

describe('difficultyMultiplier', () => {
  it('returns 2.3 for Hard', () => {
    expect(difficultyMultiplier('Hard')).toBe(2.3);
  });

  it('returns 1.0 for Medium', () => {
    expect(difficultyMultiplier('Medium')).toBe(1.0);
  });

  it('returns 0.3 for Easy', () => {
    expect(difficultyMultiplier('Easy')).toBe(0.3);
  });

  it('returns 1.0 for undefined', () => {
    expect(difficultyMultiplier(undefined)).toBe(1.0);
  });
});
