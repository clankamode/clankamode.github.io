import { describe, expect, it } from 'vitest';
import { buildSessionOperatorActions } from '@/lib/session-operator-actions';

describe('session operator actions', () => {
  it('prioritizes high urgency risks first', () => {
    const actions = buildSessionOperatorActions({
      onboardingLaunchConversion: 0.42,
      onboardingDropAfterShown: 12,
      transferStatus: 'rollback',
      openFrictionHotspots: 6,
      aiAssistOverrideRate: 0.4,
      aiAutoOverrideRate: 0.28,
      personalizationAtRiskShare: 0.44,
      personalizationLowAlignmentShare: 0.33,
      personalizationCoverage: 0.55,
    });

    expect(actions.length).toBeGreaterThanOrEqual(4);
    expect(actions[0]?.priority).toBe('high');
    expect(actions.some((action) => action.id === 'transfer-rollback')).toBe(true);
    expect(actions.some((action) => action.id === 'personalization-coverage')).toBe(true);
  });

  it('returns steady-state action when no alert conditions fire', () => {
    const actions = buildSessionOperatorActions({
      onboardingLaunchConversion: 0.72,
      onboardingDropAfterShown: 1,
      transferStatus: 'promote',
      openFrictionHotspots: 0,
      aiAssistOverrideRate: 0.11,
      aiAutoOverrideRate: 0.08,
      personalizationAtRiskShare: 0.12,
      personalizationLowAlignmentShare: 0.08,
      personalizationCoverage: 0.9,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]?.id).toBe('steady-state');
    expect(actions[0]?.priority).toBe('low');
  });
});
