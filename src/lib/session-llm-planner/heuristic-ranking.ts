import type { SessionItem } from '@/lib/progress';
import type { UserLearningState } from '@/types/micro';
import type { SessionPersonalizationProfile } from '@/lib/session-personalization';
import { candidateConceptKey, highestTitleSimilarity, normalizeConceptKey } from '@/lib/session-llm-planner/concepts';
import { clamp01, clampConfidence } from '@/lib/session-llm-planner/formatting';
import type {
  CandidateConceptStat,
  PlannerOutcomeSignals,
  SessionPlannerCandidate,
} from '@/lib/session-llm-planner/types';

// Research-backed constants
const SPACED_REVIEW_PENALTY = 3.5;
const MEDIUM_COMPLETIONS_HARD_ESCALATION_THRESHOLD = 5;

export function daysSinceLastSeen(lastSeenAt: string | null): number {
  if (!lastSeenAt) return Infinity;
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

export function minDaysUntilReview(exposures: number): number {
  if (exposures <= 2) return 2;
  if (exposures <= 5) return 3;
  return 5;
}

export function difficultyMultiplier(difficulty: 'Easy' | 'Medium' | 'Hard' | undefined): number {
  if (difficulty === 'Hard') return 2.3;
  if (difficulty === 'Easy') return 0.3;
  return 1.0;
}

export function rankCandidatesHeuristically(
  candidates: SessionPlannerCandidate[],
  userState: UserLearningState | null,
  outcomeSignals?: PlannerOutcomeSignals,
  recentActivityTitles: string[] = [],
  personalizationProfile?: SessionPersonalizationProfile | null,
  conceptStats?: CandidateConceptStat[]
): SessionPlannerCandidate[] {
  return [...candidates].sort((a, b) => {
    const scoreA = heuristicCandidateScore(
      a.item,
      userState,
      outcomeSignals,
      recentActivityTitles,
      personalizationProfile,
      conceptStats
    );
    const scoreB = heuristicCandidateScore(
      b.item,
      userState,
      outcomeSignals,
      recentActivityTitles,
      personalizationProfile,
      conceptStats
    );
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (a.item.estMinutes ?? 5) - (b.item.estMinutes ?? 5);
  });
}

function heuristicCandidateScore(
  item: SessionItem,
  userState: UserLearningState | null,
  outcomeSignals?: PlannerOutcomeSignals,
  recentActivityTitles: string[] = [],
  personalizationProfile?: SessionPersonalizationProfile | null,
  conceptStats?: CandidateConceptStat[]
): number {
  const completionRate = clamp01(outcomeSignals?.completionRate ?? 0.65);
  const timeAdherence = clamp01(outcomeSignals?.timeAdherence ?? 0.65);
  const nextDayReturnRate = clamp01(outcomeSignals?.nextDayReturnRate ?? 0.5);
  const ritualQuality = clamp01(outcomeSignals?.ritualQuality ?? 0.6);
  const confidence = clampConfidence(item.confidence);
  const minutes = item.estMinutes ?? 5;
  const concept = candidateConceptKey(item);
  const stubborn = new Set((userState?.stubbornConcepts || []).map((value) => normalizeConceptKey(value)).filter(Boolean) as string[]);
  const recent = new Set((userState?.recentConcepts || []).map((value) => normalizeConceptKey(value)).filter(Boolean) as string[]);
  const activitySimilarity = highestTitleSimilarity(item.title, recentActivityTitles);

  const conceptStat = concept && conceptStats
    ? (conceptStats.find((s) => normalizeConceptKey(s.conceptSlug) === concept) ?? null)
    : null;

  let score = confidence * 6;
  score += item.type === 'practice' ? 1 : 2;
  score += minutes >= 6 && minutes <= 12 ? 1.5 : 0;

  if (concept && stubborn.has(concept)) score += 3;
  if (concept && recent.has(concept)) score += 1.2;
  if (concept && !recent.has(concept) && !stubborn.has(concept)) score += 0.8 * ritualQuality;

  score += (1 - Math.abs(0.72 - completionRate)) * 2;
  score += (1 - Math.abs(0.7 - timeAdherence)) * 1.5;
  score += nextDayReturnRate;
  if (activitySimilarity >= 0.85) score -= 3.5;
  else if (activitySimilarity >= 0.65) score -= 2;
  else if (activitySimilarity >= 0.5) score -= 0.8;

  if (personalizationProfile) {
    if (personalizationProfile.signals.trackAlignment < 0.5 && item.pillarSlug !== personalizationProfile.selectedTrackSlug) {
      score -= 2;
    }
    if (personalizationProfile.segment === 'at_risk' || personalizationProfile.segment === 'fragile') {
      score += minutes <= 12 ? 1.2 : -1.4;
      score += confidence >= 0.7 ? 0.8 : -0.6;
    }
  }

  if (conceptStat) {
    const days = daysSinceLastSeen(conceptStat.lastSeenAt);
    const minDays = minDaysUntilReview(conceptStat.exposures);
    if (Number.isFinite(days) && days < minDays) {
      score -= SPACED_REVIEW_PENALTY;
    }
  }

  if (item.type === 'practice') {
    const diffMult = difficultyMultiplier(item.practiceDifficulty);
    score += (diffMult - 1.0) * 2.5;

    if (
      item.practiceDifficulty === 'Hard' &&
      conceptStat &&
      (conceptStat.mediumCompletions ?? 0) >= MEDIUM_COMPLETIONS_HARD_ESCALATION_THRESHOLD
    ) {
      score += 2.0;
    }
  }

  return score;
}
