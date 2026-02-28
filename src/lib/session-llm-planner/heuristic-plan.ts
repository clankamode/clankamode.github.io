import type { SessionItem } from '@/lib/progress';
import type { UserLearningState } from '@/types/micro';
import type { SessionPersonalizationProfile } from '@/lib/session-personalization';
import { EXPLOITATION_RATIO } from '@/lib/session-llm-planner/config';
import { candidateConceptKey, normalizeConceptKey } from '@/lib/session-llm-planner/concepts';
import { clampConfidence, clamp01 } from '@/lib/session-llm-planner/formatting';
import { rankCandidatesHeuristically } from '@/lib/session-llm-planner/heuristic-ranking';
import {
  enforceAtLeastOneLearn,
  enforceAtLeastOnePractice,
  capTotalMinutes,
} from '@/lib/session-llm-planner/selection-guards';
import { normalizeTargetConcept } from '@/lib/session-llm-planner/selection-normalization';
import type {
  CandidateConceptStat,
  PlannerOutcomeSignals,
  SessionPlannerCandidate,
} from '@/lib/session-llm-planner/types';

export function buildHeuristicPlan(input: {
  candidates: SessionPlannerCandidate[];
  maxItems: number;
  requirePracticeItem: boolean;
  userState: UserLearningState | null;
  personalizationProfile?: SessionPersonalizationProfile | null;
  outcomeSignals?: PlannerOutcomeSignals;
  recentActivityTitles?: string[];
  conceptStats?: CandidateConceptStat[];
}): SessionItem[] {
  const ranked = rankCandidatesHeuristically(
    input.candidates,
    input.userState,
    input.outcomeSignals,
    input.recentActivityTitles || [],
    input.personalizationProfile,
    input.conceptStats
  );
  const selected: SessionItem[] = [];
  const usedHrefs = new Set<string>();
  let totalMinutes = 0;

  for (const candidate of ranked) {
    if (selected.length >= input.maxItems) break;
    if (usedHrefs.has(candidate.item.href)) continue;
    const minutes = candidate.item.estMinutes ?? 5;
    if (selected.length > 0 && totalMinutes + minutes > 22) continue;
    usedHrefs.add(candidate.item.href);
    selected.push(candidate.item);
    totalMinutes += minutes;
  }

  const withLearn = enforceAtLeastOneLearn(selected, input.candidates, input.maxItems);
  const withPractice = input.requirePracticeItem
    ? enforceAtLeastOnePractice(withLearn, input.candidates, input.maxItems, 22)
    : withLearn;
  const diversified = enforcePlanDiversity(withPractice, input.candidates, input.maxItems, 22);
  const capped = capTotalMinutes(diversified, 22);
  return rebalanceExplorationMix(capped, ranked, input.userState, input.maxItems, 22);
}

export function enforcePlanDiversity(
  items: SessionItem[],
  candidates: SessionPlannerCandidate[],
  maxItems: number,
  maxMinutes: number
): SessionItem[] {
  if (items.length <= 1) return items.slice(0, maxItems);

  const result = [...items];
  const usedHrefs = new Set(result.map((item) => item.href));
  const totalMinutes = result.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0);

  const duplicateIndex = result.findIndex((item, index) => {
    if (index === 0) return false;
    const existingArticle = result.slice(0, index).some((entry) => entry.articleId && entry.articleId === item.articleId);
    const existingConcept = result.slice(0, index).some((entry) => candidateConceptKey(entry) && candidateConceptKey(entry) === candidateConceptKey(item));
    return existingArticle || existingConcept;
  });

  if (duplicateIndex === -1) {
    return result.slice(0, maxItems);
  }

  const removable = result[duplicateIndex];
  const removableMinutes = removable.estMinutes ?? 5;

  const replacement = candidates
    .map((candidate) => candidate.item)
    .find((candidate) => {
      if (usedHrefs.has(candidate.href)) return false;
      const replacementMinutes = candidate.estMinutes ?? 5;
      const projectedMinutes = totalMinutes - removableMinutes + replacementMinutes;
      if (projectedMinutes > maxMinutes) return false;
      const articleConflict = result.some((item, idx) => idx !== duplicateIndex && item.articleId && item.articleId === candidate.articleId);
      if (articleConflict) return false;
      const concept = candidateConceptKey(candidate);
      const conceptConflict = result.some((item, idx) => idx !== duplicateIndex && concept && candidateConceptKey(item) === concept);
      if (conceptConflict) return false;
      return true;
    });

  if (!replacement) {
    return result.slice(0, maxItems);
  }

  result[duplicateIndex] = replacement;
  return result.slice(0, maxItems);
}

function rebalanceExplorationMix(
  selectedItems: SessionItem[],
  rankedCandidates: SessionPlannerCandidate[],
  userState: UserLearningState | null,
  maxItems: number,
  maxMinutes: number
): SessionItem[] {
  if (selectedItems.length <= 1) return selectedItems;

  const knownConcepts = new Set<string>();
  for (const value of userState?.stubbornConcepts || []) {
    const normalized = normalizeConceptKey(value);
    if (normalized) knownConcepts.add(normalized);
  }
  for (const value of userState?.recentConcepts || []) {
    const normalized = normalizeConceptKey(value);
    if (normalized) knownConcepts.add(normalized);
  }

  const classify = (item: SessionItem): 'exploit' | 'explore' => {
    const concept = candidateConceptKey(item);
    if (!concept) return 'explore';
    return knownConcepts.has(concept) ? 'exploit' : 'explore';
  };

  const targetExploitCount = Math.max(1, Math.round(selectedItems.length * EXPLOITATION_RATIO));
  const next = [...selectedItems];
  const exploitCount = next.filter((item) => classify(item) === 'exploit').length;

  if (exploitCount < targetExploitCount) {
    const exploitFallback = rankedCandidates
      .map((candidate) => candidate.item)
      .find((item) => classify(item) === 'exploit' && !next.some((selected) => selected.href === item.href));
    if (exploitFallback) {
      next.push(exploitFallback);
    }
  }

  const desiredExploreCount = Math.max(1, next.length - targetExploitCount);
  const exploreCount = next.filter((item) => classify(item) === 'explore').length;
  if (exploreCount < desiredExploreCount) {
    const exploreFallback = rankedCandidates
      .map((candidate) => candidate.item)
      .find((item) => classify(item) === 'explore' && !next.some((selected) => selected.href === item.href));
    if (exploreFallback) {
      next.push(exploreFallback);
    }
  }

  const deduped: SessionItem[] = [];
  const seen = new Set<string>();
  for (const item of next) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    deduped.push(item);
  }

  const trimmed = deduped.slice(0, maxItems);
  return capTotalMinutes(trimmed, maxMinutes);
}

export function widenThinPlan(
  selectedItems: SessionItem[],
  candidates: SessionPlannerCandidate[],
  maxItems: number,
  maxMinutes: number
): SessionItem[] {
  if (selectedItems.length >= 2 || selectedItems.length === 0) return selectedItems;
  if (selectedItems.length >= maxItems) return selectedItems;

  const usedHrefs = new Set(selectedItems.map((item) => item.href));
  const currentMinutes = selectedItems.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0);
  const primaryType = selectedItems[0]?.type;

  const fallback = [...candidates]
    .filter((candidate) => !usedHrefs.has(candidate.item.href))
    .map((candidate) => candidate.item)
    .filter((item) => currentMinutes + (item.estMinutes ?? 5) <= maxMinutes)
    .sort((a, b) => {
      const typeScoreA = a.type !== primaryType ? 1 : 0;
      const typeScoreB = b.type !== primaryType ? 1 : 0;
      if (typeScoreA !== typeScoreB) return typeScoreB - typeScoreA;

      const confidenceA = clampConfidence(a.confidence);
      const confidenceB = clampConfidence(b.confidence);
      if (confidenceA !== confidenceB) return confidenceB - confidenceA;

      return (a.estMinutes ?? 5) - (b.estMinutes ?? 5);
    })[0];

  if (!fallback) return selectedItems;
  return [...selectedItems, fallback].slice(0, maxItems);
}

export function scorePlan(
  items: SessionItem[],
  candidates: SessionPlannerCandidate[],
  outcomeSignals?: PlannerOutcomeSignals,
  userState?: UserLearningState | null,
  personalizationProfile?: SessionPersonalizationProfile | null
): number {
  const candidateCount = candidates.length;
  if (items.length === 0) return -100;

  const totalMinutes = items.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0);
  const hasLearn = items.some((item) => item.type === 'learn');
  const hasPractice = items.some((item) => item.type === 'practice');
  const uniqueConceptCount = new Set(
    items.map((item) => normalizeTargetConcept(item.targetConcept ?? undefined, item.primaryConceptSlug))
  ).size;
  const completionRate = clamp01(outcomeSignals?.completionRate ?? 0.65);
  const timeAdherence = clamp01(outcomeSignals?.timeAdherence ?? 0.65);
  const nextDayReturnRate = clamp01(outcomeSignals?.nextDayReturnRate ?? 0.5);
  const ritualQuality = clamp01(outcomeSignals?.ritualQuality ?? 0.6);
  const knownConcepts = new Set<string>();
  for (const concept of userState?.recentConcepts || []) {
    const normalized = normalizeConceptKey(concept);
    if (normalized) knownConcepts.add(normalized);
  }
  for (const concept of userState?.stubbornConcepts || []) {
    const normalized = normalizeConceptKey(concept);
    if (normalized) knownConcepts.add(normalized);
  }
  const exploreCount = items.filter((item) => {
    const concept = candidateConceptKey(item);
    return concept ? !knownConcepts.has(concept) : true;
  }).length;

  let score = 0;
  score += items.length >= 2 ? 8 : (candidateCount > 1 ? -4 : 3);
  score += hasLearn && hasPractice ? 6 : 2;
  score += totalMinutes >= 12 && totalMinutes <= 22 ? 4 : -2;
  score += uniqueConceptCount >= 2 ? 2 : 0;
  score += completionRate >= 0.6 ? 2 : -1;
  score += timeAdherence >= 0.6 ? 2 : -1.5;
  score += nextDayReturnRate * 2;
  score += ritualQuality * 1.5;
  score += exploreCount > 0 ? 1.5 : -1;
  if (completionRate < 0.45 && items.length > 2) score -= 2;
  if (timeAdherence < 0.45 && totalMinutes > 18) score -= 2;
  if (personalizationProfile) {
    if (personalizationProfile.segment === 'at_risk' || personalizationProfile.segment === 'fragile') {
      score += totalMinutes <= 16 ? 2 : -2;
    }
    if (personalizationProfile.signals.trackAlignment < 0.5) {
      const alignedCount = items.filter((item) => item.pillarSlug === personalizationProfile.selectedTrackSlug).length;
      score += alignedCount >= Math.max(1, Math.ceil(items.length / 2)) ? 1.8 : -1.5;
    }
  }

  const averageConfidence = items.reduce((sum, item) => sum + clampConfidence(item.confidence), 0) / items.length;
  score += averageConfidence * 5;

  return score;
}
