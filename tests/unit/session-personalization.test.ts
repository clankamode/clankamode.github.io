import { describe, expect, it } from 'vitest';
import {
  buildPersonalizationInsights,
  buildSessionPersonalizationProfile,
} from '@/lib/session-personalization';

describe('session personalization profile', () => {
  it('scores high and recommends maintain_momentum for aligned stable users', () => {
    const profile = buildSessionPersonalizationProfile({
      selectedTrackSlug: 'dsa',
      onboardingGoal: 'interview',
      onboardingTrackSlug: 'dsa',
      onboardingBiasActive: true,
      committedSessionCount: 2,
      stubbornConceptCount: 1,
      failureModeCount: 1,
      outcomeSignals: {
        completionRate: 0.86,
        timeAdherence: 0.82,
        nextDayReturnRate: 0.9,
        ritualQuality: 0.88,
      },
    });

    expect(profile.score).toBeGreaterThan(0.74);
    expect(profile.segment).toBe('momentum');
    expect(profile.recommendation).toBe('maintain_momentum');
    expect(profile.signals.trackAlignment).toBe(1);
  });

  it('flags misalignment and returns realign_track recommendation', () => {
    const profile = buildSessionPersonalizationProfile({
      selectedTrackSlug: 'system-design',
      onboardingGoal: 'interview',
      onboardingTrackSlug: 'dsa',
      onboardingBiasActive: false,
      committedSessionCount: 9,
      stubbornConceptCount: 4,
      failureModeCount: 3,
      outcomeSignals: {
        completionRate: 0.34,
        timeAdherence: 0.4,
        nextDayReturnRate: 0.2,
        ritualQuality: 0.45,
      },
    });

    expect(profile.segment === 'fragile' || profile.segment === 'at_risk').toBe(true);
    expect(profile.recommendation).toBe('realign_track');
    expect(profile.reasons.some((reason) => reason.toLowerCase().includes('misaligned'))).toBe(true);
  });
});

describe('personalization insights', () => {
  it('aggregates score and distributions', () => {
    const summary = buildPersonalizationInsights([
      {
        createdAt: '2026-02-16T10:00:00Z',
        sessionId: 's1',
        trackSlug: 'dsa',
        score: 0.82,
        segment: 'momentum',
        recommendation: 'maintain_momentum',
        trackAlignment: 1,
        continuation: 0.8,
        ritual: 0.9,
        focusStability: 0.75,
      },
      {
        createdAt: '2026-02-16T11:00:00Z',
        sessionId: 's2',
        trackSlug: 'dsa',
        score: 0.39,
        segment: 'at_risk',
        recommendation: 'reduce_scope',
        trackAlignment: 0.45,
        continuation: 0.35,
        ritual: 0.4,
        focusStability: 0.38,
      },
    ]);

    expect(summary.total).toBe(2);
    expect(summary.averageScore).not.toBeNull();
    expect(summary.averageScore!).toBeCloseTo(0.605, 3);
    expect(summary.atRiskShare).toBeCloseTo(0.5, 4);
    expect(summary.lowAlignmentShare).toBeCloseTo(0.5, 4);
    expect(summary.segmentDistribution[0]?.count).toBe(1);
  });
});
