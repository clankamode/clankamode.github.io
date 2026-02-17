export type OperatorActionPriority = 'high' | 'medium' | 'low';

export interface SessionOperatorAction {
  id: string;
  priority: OperatorActionPriority;
  title: string;
  rationale: string;
  recommendation: string;
  href: string;
}

interface BuildOperatorActionsInput {
  onboardingLaunchConversion: number;
  onboardingDropAfterShown: number;
  transferStatus: 'promote' | 'hold' | 'rollback';
  openFrictionHotspots: number;
  aiAssistOverrideRate: number;
  aiAutoOverrideRate: number;
  personalizationAtRiskShare: number;
  personalizationLowAlignmentShare: number;
  personalizationCoverage: number;
}

export function buildSessionOperatorActions(input: BuildOperatorActionsInput): SessionOperatorAction[] {
  const actions: SessionOperatorAction[] = [];

  if (input.onboardingLaunchConversion < 0.55 && input.onboardingDropAfterShown >= 5) {
    actions.push({
      id: 'onboarding-launch-drop',
      priority: 'high',
      title: 'Fix first-win launch drop-off',
      rationale: `Launch conversion is ${(input.onboardingLaunchConversion * 100).toFixed(1)}% with ${input.onboardingDropAfterShown} users dropping after the first screen.`,
      recommendation: 'Simplify step-1 intent choices and reduce copy friction before plan generation.',
      href: '/admin/session-intelligence?tab=quality',
    });
  }

  if (input.personalizationCoverage < 0.7) {
    actions.push({
      id: 'personalization-coverage',
      priority: 'high',
      title: 'Increase personalization signal coverage',
      rationale: `Only ${(input.personalizationCoverage * 100).toFixed(1)}% of committed sessions have a personalization profile snapshot.`,
      recommendation: 'Audit telemetry path and ensure profile scoring emits for all qualified gate renders.',
      href: '/admin/session-intelligence?tab=quality',
    });
  }

  if (input.personalizationAtRiskShare >= 0.35) {
    actions.push({
      id: 'personalization-at-risk',
      priority: 'high',
      title: 'Reduce at-risk personalization cohort',
      rationale: `${(input.personalizationAtRiskShare * 100).toFixed(1)}% of sessions are fragile or at-risk.`,
      recommendation: 'Bias next plans toward shorter, high-confidence items and check if session scope is too long.',
      href: '/admin/session-intelligence?tab=quality',
    });
  }

  if (input.personalizationLowAlignmentShare >= 0.3) {
    actions.push({
      id: 'track-alignment',
      priority: 'medium',
      title: 'Correct track alignment drift',
      rationale: `${(input.personalizationLowAlignmentShare * 100).toFixed(1)}% of profiles show weak onboarding-to-track alignment.`,
      recommendation: 'Prioritize goal-aligned track defaults for next session recommendations.',
      href: '/admin/session-intelligence?tab=quality',
    });
  }

  if (input.transferStatus === 'rollback') {
    actions.push({
      id: 'transfer-rollback',
      priority: 'high',
      title: 'Stabilize transfer score before promotion',
      rationale: 'Transfer score status is rollback, indicating quality guardrails are currently violated.',
      recommendation: 'Investigate repeated failure loops and proof coverage gaps before expanding planner ambition.',
      href: '/admin/session-intelligence?tab=quality',
    });
  }

  if (input.openFrictionHotspots > 0) {
    actions.push({
      id: 'friction-hotspots',
      priority: input.openFrictionHotspots >= 5 ? 'high' : 'medium',
      title: 'Drain open friction hotspots',
      rationale: `${input.openFrictionHotspots} hotspot(s) remain unresolved.`,
      recommendation: 'Use AI-assisted triage for top risk rows, then manually review overridden recommendations.',
      href: '/admin/session-intelligence?tab=friction',
    });
  }

  const worstOverrideRate = Math.max(input.aiAssistOverrideRate, input.aiAutoOverrideRate);
  if (worstOverrideRate >= 0.35) {
    actions.push({
      id: 'ai-calibration',
      priority: 'medium',
      title: 'Recalibrate AI triage confidence',
      rationale: `Override rate is ${(worstOverrideRate * 100).toFixed(1)}% in at least one AI recommendation mode.`,
      recommendation: 'Review confidence thresholds and decision prompts to reduce avoidable manual corrections.',
      href: '/admin/session-intelligence?tab=friction',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'steady-state',
      priority: 'low',
      title: 'System is in healthy range',
      rationale: 'Current quality, personalization, and triage metrics show no acute risks.',
      recommendation: 'Continue monitoring and iterate on long-horizon optimization experiments.',
      href: '/admin/session-intelligence?tab=quality',
    });
  }

  return actions.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
}

function priorityWeight(value: OperatorActionPriority): number {
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  return 1;
}
