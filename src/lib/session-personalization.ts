import type { OnboardingGoal } from '@/types/onboarding';

export type PersonalizationSegment = 'momentum' | 'steady' | 'fragile' | 'at_risk';

export interface PersonalizationOutcomeSignals {
  completionRate: number;
  timeAdherence: number;
  nextDayReturnRate: number;
  ritualQuality: number;
}

export interface SessionPersonalizationProfile {
  score: number;
  segment: PersonalizationSegment;
  recommendation:
    | 'maintain_momentum'
    | 'reduce_scope'
    | 'realign_track'
    | 'reinforce_ritual'
    | 'stabilize_execution';
  goal: OnboardingGoal | null;
  selectedTrackSlug: string;
  expectedTrackSlug: string | null;
  onboardingBiasActive: boolean;
  committedSessionCount: number;
  signals: {
    trackAlignment: number;
    continuation: number;
    ritual: number;
    focusStability: number;
    goalClarity: number;
  };
  reasons: string[];
}

interface BuildProfileInput {
  selectedTrackSlug: string;
  onboardingGoal: OnboardingGoal | null;
  onboardingTrackSlug: string | null;
  onboardingBiasActive: boolean;
  committedSessionCount: number;
  stubbornConceptCount: number;
  failureModeCount: number;
  outcomeSignals: PersonalizationOutcomeSignals;
}

export function buildSessionPersonalizationProfile(input: BuildProfileInput): SessionPersonalizationProfile {
  const expectedTrackSlug = inferExpectedTrackSlug(input.onboardingGoal, input.onboardingTrackSlug);
  const trackAlignment = computeTrackAlignment(expectedTrackSlug, input.selectedTrackSlug, input.onboardingGoal);
  const continuation = clamp01(
    0.45 * input.outcomeSignals.completionRate
      + 0.35 * input.outcomeSignals.timeAdherence
      + 0.2 * input.outcomeSignals.nextDayReturnRate
  );
  const ritual = clamp01(input.outcomeSignals.ritualQuality);
  const pressure = clamp01((input.stubbornConceptCount + input.failureModeCount) / 8);
  const focusStability = clamp01(1 - pressure * 0.75);
  const goalClarity = input.onboardingGoal ? 1 : 0.4;

  let score = clamp01(
    0.3 * trackAlignment
      + 0.3 * continuation
      + 0.15 * ritual
      + 0.15 * focusStability
      + 0.1 * goalClarity
  );

  if (input.committedSessionCount <= 2 && input.onboardingGoal) {
    score = clamp01(score + 0.03);
  }

  const segment = classifySegment(score);
  const recommendation = pickRecommendation({
    score,
    trackAlignment,
    continuation,
    ritual,
    focusStability,
  });

  return {
    score,
    segment,
    recommendation,
    goal: input.onboardingGoal,
    selectedTrackSlug: input.selectedTrackSlug,
    expectedTrackSlug,
    onboardingBiasActive: input.onboardingBiasActive,
    committedSessionCount: input.committedSessionCount,
    signals: {
      trackAlignment,
      continuation,
      ritual,
      focusStability,
      goalClarity,
    },
    reasons: buildReasons({
      trackAlignment,
      continuation,
      ritual,
      focusStability,
      segment,
      recommendation,
    }),
  };
}

export interface PersonalizationSnapshot {
  createdAt: string;
  sessionId: string;
  trackSlug: string;
  score: number;
  segment: PersonalizationSegment;
  recommendation: SessionPersonalizationProfile['recommendation'];
  trackAlignment: number;
  continuation: number;
  ritual: number;
  focusStability: number;
}

export interface PersonalizationInsights {
  total: number;
  averageScore: number | null;
  atRiskShare: number;
  lowAlignmentShare: number;
  segmentDistribution: Array<{ segment: PersonalizationSegment; count: number; share: number }>;
  recommendationDistribution: Array<{ recommendation: SessionPersonalizationProfile['recommendation']; count: number; share: number }>;
}

export function buildPersonalizationInsights(rows: PersonalizationSnapshot[]): PersonalizationInsights {
  if (rows.length === 0) {
    return {
      total: 0,
      averageScore: null,
      atRiskShare: 0,
      lowAlignmentShare: 0,
      segmentDistribution: [],
      recommendationDistribution: [],
    };
  }

  const total = rows.length;
  const averageScore = rows.reduce((sum, row) => sum + clamp01(row.score), 0) / total;
  const atRiskCount = rows.filter((row) => row.segment === 'at_risk' || row.segment === 'fragile').length;
  const lowAlignmentCount = rows.filter((row) => row.trackAlignment < 0.5).length;

  const segmentMap = new Map<PersonalizationSegment, number>();
  const recommendationMap = new Map<SessionPersonalizationProfile['recommendation'], number>();
  for (const row of rows) {
    segmentMap.set(row.segment, (segmentMap.get(row.segment) ?? 0) + 1);
    recommendationMap.set(row.recommendation, (recommendationMap.get(row.recommendation) ?? 0) + 1);
  }

  const segmentDistribution = Array.from(segmentMap.entries())
    .map(([segment, count]) => ({ segment, count, share: count / total }))
    .sort((a, b) => b.count - a.count);

  const recommendationDistribution = Array.from(recommendationMap.entries())
    .map(([recommendation, count]) => ({ recommendation, count, share: count / total }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    averageScore,
    atRiskShare: atRiskCount / total,
    lowAlignmentShare: lowAlignmentCount / total,
    segmentDistribution,
    recommendationDistribution,
  };
}

function inferExpectedTrackSlug(goal: OnboardingGoal | null, onboardingTrackSlug: string | null): string | null {
  if (onboardingTrackSlug) {
    return onboardingTrackSlug;
  }
  if (goal === 'work') return 'system-design';
  if (goal === 'interview' || goal === 'fundamentals') return 'dsa';
  return null;
}

function computeTrackAlignment(expectedTrackSlug: string | null, selectedTrackSlug: string, goal: OnboardingGoal | null): number {
  if (!goal) return 0.5;
  if (!expectedTrackSlug) return 0.65;
  return expectedTrackSlug === selectedTrackSlug ? 1 : 0.35;
}

function classifySegment(score: number): PersonalizationSegment {
  if (score >= 0.74) return 'momentum';
  if (score >= 0.56) return 'steady';
  if (score >= 0.4) return 'fragile';
  return 'at_risk';
}

function pickRecommendation(input: {
  score: number;
  trackAlignment: number;
  continuation: number;
  ritual: number;
  focusStability: number;
}): SessionPersonalizationProfile['recommendation'] {
  if (input.trackAlignment < 0.5) return 'realign_track';
  if (input.continuation < 0.52) return 'reduce_scope';
  if (input.focusStability < 0.5) return 'stabilize_execution';
  if (input.ritual < 0.5) return 'reinforce_ritual';
  if (input.score >= 0.74) return 'maintain_momentum';
  return 'reduce_scope';
}

function buildReasons(input: {
  trackAlignment: number;
  continuation: number;
  ritual: number;
  focusStability: number;
  segment: PersonalizationSegment;
  recommendation: SessionPersonalizationProfile['recommendation'];
}): string[] {
  const reasons: string[] = [];
  if (input.trackAlignment < 0.5) {
    reasons.push('Selected track is misaligned with onboarding goal.');
  }
  if (input.continuation < 0.55) {
    reasons.push('Continuation quality signals are below target.');
  }
  if (input.focusStability < 0.55) {
    reasons.push('Execution stability suggests concept-level friction pressure.');
  }
  if (input.ritual < 0.5) {
    reasons.push('Reflection ritual quality is below healthy baseline.');
  }
  if (reasons.length === 0) {
    reasons.push(`Segment is ${input.segment}; recommendation is ${input.recommendation}.`);
  }
  return reasons;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
