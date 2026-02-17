import { describe, expect, it } from 'vitest';
import { applyPersonalizationScopeExperiment } from '@/lib/session-personalization-experiment';
import { buildSessionPersonalizationProfile } from '@/lib/session-personalization';

const items = [
  { href: '/learn/dsa/a', estMinutes: 8 },
  { href: '/learn/dsa/b', estMinutes: 8 },
  { href: '/learn/dsa/c', estMinutes: 10 },
];

describe('session personalization scope experiment', () => {
  it('does not enroll non-fragile profiles', () => {
    const profile = buildSessionPersonalizationProfile({
      selectedTrackSlug: 'dsa',
      onboardingGoal: 'interview',
      onboardingTrackSlug: 'dsa',
      onboardingBiasActive: true,
      committedSessionCount: 1,
      stubbornConceptCount: 1,
      failureModeCount: 0,
      outcomeSignals: {
        completionRate: 0.85,
        timeAdherence: 0.82,
        nextDayReturnRate: 0.8,
        ritualQuality: 0.8,
      },
    });

    const result = applyPersonalizationScopeExperiment({
      userId: 'stable-user@example.com',
      items,
      profile,
    });

    expect(result.experiment.eligible).toBe(false);
    expect(result.experiment.cohort).toBe('not_eligible');
    expect(result.experiment.applied).toBe(false);
    expect(result.items).toHaveLength(3);
  });

  it('assigns deterministic cohort for eligible profile and trims only in treatment', () => {
    const profile = buildSessionPersonalizationProfile({
      selectedTrackSlug: 'system-design',
      onboardingGoal: 'interview',
      onboardingTrackSlug: 'dsa',
      onboardingBiasActive: false,
      committedSessionCount: 8,
      stubbornConceptCount: 4,
      failureModeCount: 3,
      outcomeSignals: {
        completionRate: 0.32,
        timeAdherence: 0.38,
        nextDayReturnRate: 0.2,
        ritualQuality: 0.4,
      },
    });

    const runA = applyPersonalizationScopeExperiment({
      userId: 'eligible-user@example.com',
      items,
      profile,
    });
    const runB = applyPersonalizationScopeExperiment({
      userId: 'eligible-user@example.com',
      items,
      profile,
    });

    expect(runA.experiment.eligible).toBe(true);
    expect(runA.experiment.cohort).toBe(runB.experiment.cohort);
    if (runA.experiment.cohort === 'treatment') {
      expect(runA.items.length).toBeLessThanOrEqual(2);
      expect(runA.experiment.applied).toBe(true);
    } else {
      expect(runA.items).toHaveLength(3);
      expect(runA.experiment.applied).toBe(false);
    }
  });
});
