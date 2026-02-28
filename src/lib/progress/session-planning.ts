import { applySessionPlanPolicySelection, buildHeuristicPlan, planSessionItemsWithLLM } from '@/lib/session-llm-planner';
import { getFromCache, setInCache } from '@/lib/redis';
import { getCachedSessionPlan, storeCachedSessionPlan } from '@/lib/session-plan-cache';
import { buildAIDecisionDedupeKey, logAIDecision } from '@/lib/ai-decision-registry';
import {
  POLICY_PROMPT_VERSION,
  SESSION_PLAN_LOCK_TTL_SECONDS,
} from '@/lib/progress/constants';
import { isPracticeTrack } from '@/lib/progress/identity';
import { normalizeSessionItemHref } from '@/lib/progress/helpers';
import type {
  SessionGenerationInput,
  SessionPlanningResult,
  SessionPlanLock,
} from '@/lib/progress/types';
import { decideSessionPlanPolicy } from '@/lib/ai-policy/runtime';

export async function planSessionItemsForState(
  input: SessionGenerationInput
): Promise<SessionPlanningResult> {
  const {
    userId,
    dayKey,
    trackSlug,
    trackName,
    userState,
    completedIds,
    articleCandidates,
    sectionCandidates,
    practiceCandidates,
    recentExclusionHrefs,
    personalizationProfile,
    summaryRecentActivityTitles,
    outcomeSignals,
    aiPolicySessionPlanEnabled,
    practiceTargetDifficulty,
  } = input;

  let sessionItems = articleCandidates.slice(0, 3);
  let planPolicyDecisionId: string | null = null;
  let policyFallbackUsed = false;

  const learnPlannerPool = [...sectionCandidates.slice(0, 8), ...articleCandidates.slice(0, 6)];
  const plannerCandidates = [
    ...learnPlannerPool.map((item) => ({
      id: item.sessionChunkIndex !== undefined
        ? `learn:${item.articleId || item.href}:chunk:${item.sessionChunkIndex}`
        : `learn:${item.articleId || item.href}`,
      item,
    })),
    ...practiceCandidates.map((item) => ({
      id: `practice:${item.practiceQuestionId || item.href}`,
      item,
    })),
  ];

  const requirePracticeItem = isPracticeTrack(trackSlug) && practiceCandidates.length > 0 && articleCandidates.length < 2;
  const deterministicPlan = buildHeuristicPlan({
    candidates: plannerCandidates,
    maxItems: 3,
    requirePracticeItem,
    userState,
    personalizationProfile,
    outcomeSignals,
    recentActivityTitles: summaryRecentActivityTitles,
  });

  const plannerCandidateSet = new Set(plannerCandidates.map((candidate) => candidate.item.href));
  const sessionPlanLockKey = `session-plan-lock:v1:${userId}:${trackSlug}`;
  const existingPlanLock = await getFromCache<SessionPlanLock>(sessionPlanLockKey);

  const isLockValid = existingPlanLock &&
    Array.isArray(existingPlanLock.items) &&
    existingPlanLock.items.length > 0 &&
    Array.isArray(existingPlanLock.itemHrefs) &&
    existingPlanLock.itemHrefs.every((href) => {
      const normalized = normalizeSessionItemHref(href);
      const itemInLock = existingPlanLock.items.find((i) => i.href === href);
      const inDbCompletions = itemInLock?.articleId ? completedIds.has(itemInLock.articleId) : false;
      return plannerCandidateSet.has(href) && !recentExclusionHrefs.has(normalized) && !inDbCompletions;
    });

  if (isLockValid) {
    sessionItems = existingPlanLock.items.slice(0, 3);
    if (aiPolicySessionPlanEnabled) {
      const selectedIds = sessionItems
        .map((item) => plannerCandidates.find((candidate) => candidate.item.href === item.href)?.id)
        .filter((id): id is string => Boolean(id));
      const lockedPlanDecision = await logAIDecision({
        decisionType: 'session_plan',
        decisionMode: 'auto',
        trackSlug,
        stepIndex: null,
        actorEmail: userId,
        model: 'locked-plan',
        promptVersion: POLICY_PROMPT_VERSION,
        confidence: 1,
        rationale: 'Reused valid session plan lock.',
        inputJson: {
          source: 'session_plan_lock',
          candidateCount: plannerCandidates.length,
          requirePracticeItem,
        },
        outputJson: {
          selectedIds,
          selectedHrefs: sessionItems.map((item) => item.href),
        },
        applied: true,
        source: 'ai_policy',
        decisionScope: 'planner',
        decisionTarget: `home_gate:${userId}`,
        fallbackUsed: false,
        latencyMs: 0,
        errorCode: null,
        dedupeKey: buildAIDecisionDedupeKey({
          decisionType: 'session_plan',
          decisionMode: 'auto',
          decisionScope: 'planner',
          trackSlug,
          stepIndex: null,
          source: 'ai_policy',
          decisionTarget: `home_gate:${userId}`,
        }),
      });
      planPolicyDecisionId = lockedPlanDecision.id;
    }
    return { sessionItems, planPolicyDecisionId, policyFallbackUsed };
  }

  if (aiPolicySessionPlanEnabled && plannerCandidates.length > 0) {
    const baseLearnCandidate = sectionCandidates[0] || articleCandidates[0] || null;
    const deterministicFallbackItems = deterministicPlan.length > 0
      ? deterministicPlan
      : (practiceCandidates[0]
        ? (baseLearnCandidate
          ? [baseLearnCandidate, practiceCandidates[0]]
          : [practiceCandidates[0]])
        : []);
    const fallbackSelectedIds = deterministicFallbackItems
      .map((item) => plannerCandidates.find((candidate) => candidate.item.href === item.href)?.id)
      .filter((id): id is string => !!id);

    const planPolicy = await decideSessionPlanPolicy({
      trackSlug,
      trackName,
      maxItems: 3,
      requirePracticeItem,
      recentActivityTitles: summaryRecentActivityTitles,
      candidates: plannerCandidates.slice(0, 12).map((candidate) => ({
        id: candidate.id,
        type: candidate.item.type,
        title: candidate.item.title,
        estMinutes: candidate.item.estMinutes ?? 5,
        targetConcept: candidate.item.targetConcept ?? null,
      })),
      fallbackOutput: {
        selectedIds: fallbackSelectedIds.length > 0
          ? fallbackSelectedIds
          : plannerCandidates.slice(0, 3).map((candidate) => candidate.id),
        reasonSummary: 'Deterministic fallback session plan.',
      },
    });

    const selectedByPolicy = applySessionPlanPolicySelection({
      selectedIds: planPolicy.output.selectedIds,
      candidates: plannerCandidates,
      maxItems: 3,
      requirePracticeItem,
    });
    sessionItems = selectedByPolicy.length > 0 ? selectedByPolicy : deterministicFallbackItems;
    if (selectedByPolicy.length === 0) {
      policyFallbackUsed = true;
    }
    policyFallbackUsed = policyFallbackUsed || planPolicy.fallbackUsed;

    const planDecision = await logAIDecision({
      decisionType: 'session_plan',
      decisionMode: 'auto',
      trackSlug,
      stepIndex: null,
      actorEmail: userId,
      model: planPolicy.model,
      promptVersion: POLICY_PROMPT_VERSION,
      confidence: planPolicy.confidence,
      rationale: planPolicy.output.reasonSummary,
      inputJson: {
        candidateCount: plannerCandidates.length,
        requirePracticeItem,
        recentActivityTitles: summaryRecentActivityTitles.slice(0, 6),
      },
      outputJson: {
        selectedIds: planPolicy.output.selectedIds,
        selectedHrefs: sessionItems.map((item) => item.href),
      },
      applied: true,
      source: 'ai_policy',
      decisionScope: 'planner',
      decisionTarget: `home_gate:${userId}`,
      fallbackUsed: planPolicy.fallbackUsed,
      latencyMs: planPolicy.latencyMs,
      errorCode: planPolicy.errorCode === 'none' ? null : planPolicy.errorCode,
      dedupeKey: buildAIDecisionDedupeKey({
        decisionType: 'session_plan',
        decisionMode: 'auto',
        decisionScope: 'planner',
        trackSlug,
        stepIndex: null,
        source: 'ai_policy',
        decisionTarget: `home_gate:${userId}`,
      }),
    });
    planPolicyDecisionId = planDecision.id;
  } else {
    const supabaseCached = await getCachedSessionPlan(userId, trackSlug);
    const isSupabaseCacheValid = supabaseCached &&
      supabaseCached.length > 0 &&
      supabaseCached.every((item) => {
        const normalized = normalizeSessionItemHref(item.href);
        const inDbCompletions = item.articleId ? completedIds.has(item.articleId) : false;
        return plannerCandidateSet.has(item.href) && !recentExclusionHrefs.has(normalized) && !inDbCompletions;
      });

    if (isSupabaseCacheValid) {
      sessionItems = supabaseCached.slice(0, 3);
    } else {
      const plannedItems = await planSessionItemsWithLLM({
        cacheKey: `${userId}:${trackSlug}:${dayKey}:${plannerCandidates.map((c) => c.id).join('|')}`,
        budgetKey: `${userId}:${dayKey}`,
        trackSlug,
        trackName,
        userState,
        personalizationProfile,
        recentActivityTitles: summaryRecentActivityTitles,
        outcomeSignals,
        practiceTargetDifficulty,
        requirePracticeItem,
        candidates: plannerCandidates,
        maxItems: 3,
      });

      if (plannedItems && plannedItems.length > 0) {
        sessionItems = plannedItems;
        storeCachedSessionPlan(userId, trackSlug, plannedItems).catch(() => {});
      } else if (practiceCandidates.length > 0) {
        if (articleCandidates.length >= 2) {
          sessionItems = articleCandidates.slice(0, 3);
        } else {
          const baseLearn = sectionCandidates[0] || articleCandidates[0] || null;
          sessionItems = baseLearn
            ? [baseLearn, practiceCandidates[0]]
            : [practiceCandidates[0]];
        }
      } else if (deterministicPlan.length > 0) {
        sessionItems = deterministicPlan;
      }
    }
  }

  if (sessionItems.length > 0) {
    await setInCache(
      sessionPlanLockKey,
      {
        createdAt: Date.now(),
        itemHrefs: sessionItems.map((item) => item.href),
        items: sessionItems,
      },
      SESSION_PLAN_LOCK_TTL_SECONDS
    );
  }

  return { sessionItems, planPolicyDecisionId, policyFallbackUsed };
}
