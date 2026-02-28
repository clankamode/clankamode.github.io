import type { UserLearningState } from '@/types/micro';
import type { PlannerOutcomeSignals } from '@/lib/session-llm-planner/types';
import type { SessionPersonalizationProfile } from '@/lib/session-personalization';

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function clampConfidence(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

export function formatOutcomeSignals(outcomeSignals?: PlannerOutcomeSignals): string {
  if (!outcomeSignals) return 'none';
  return JSON.stringify({
    completionRate: clamp01(outcomeSignals.completionRate),
    timeAdherence: clamp01(outcomeSignals.timeAdherence),
    nextDayReturnRate: clamp01(outcomeSignals.nextDayReturnRate),
    ritualQuality: clamp01(outcomeSignals.ritualQuality),
  });
}

export function formatPersonalizationProfile(profile?: SessionPersonalizationProfile | null): string {
  if (!profile) return 'none';
  return JSON.stringify({
    score: clamp01(profile.score),
    segment: profile.segment,
    recommendation: profile.recommendation,
    expectedTrackSlug: profile.expectedTrackSlug,
    selectedTrackSlug: profile.selectedTrackSlug,
    signals: {
      trackAlignment: clamp01(profile.signals.trackAlignment),
      continuation: clamp01(profile.signals.continuation),
      ritual: clamp01(profile.signals.ritual),
      focusStability: clamp01(profile.signals.focusStability),
    },
  });
}

export function formatLastInternalization(userState: UserLearningState | null): string {
  if (!userState?.lastInternalization) return 'none';
  const { conceptSlug, picked } = userState.lastInternalization;
  return `${conceptSlug} (${picked})`;
}
