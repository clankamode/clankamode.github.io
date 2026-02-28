import { getFromCache, setInCache } from '@/lib/redis';
import {
  MAX_PLANNER_ATTEMPTS,
  PLANNER_DEBUG_LOGS,
  PLANNER_MAX_OUTPUT_TOKENS,
  PLANNER_MODEL_FALLBACKS,
  PLANNER_REASONING_EFFORT,
  plannerClient,
} from '@/lib/session-llm-planner/config';
import { applySkillFrontierGating, candidateConceptKey } from '@/lib/session-llm-planner/concepts';
import { clampConfidence } from '@/lib/session-llm-planner/formatting';
import { buildHeuristicPlan, scorePlan, widenThinPlan } from '@/lib/session-llm-planner/heuristic-plan';
import { consumeBudgetCall, deriveBudgetKeyFromCacheKey, getCacheTTLSeconds } from '@/lib/session-llm-planner/llm-budget';
import { extractOutputText, rankCandidatesStageA } from '@/lib/session-llm-planner/llm-ranker';
import { buildPlannerPrompt } from '@/lib/session-llm-planner/prompt';
import { finalizeSelectedItems, parsePlannerJSON, validatePlannerResponse } from '@/lib/session-llm-planner/validation';
import type {
  SessionPlannerCandidate,
  SessionPlannerInput,
  SessionPlannerResponse,
} from '@/lib/session-llm-planner/types';

export async function planSessionItemsWithLLM(input: SessionPlannerInput) {
  if (!plannerClient) return null;
  if (input.candidates.length === 0) return null;

  const maxItems = Math.min(Math.max(input.maxItems ?? 3, 1), 4);
  const frontierCandidates = applySkillFrontierGating(input.candidates, input.userState, input.trackSlug);
  const effectiveCandidates = frontierCandidates.length > 0 ? frontierCandidates : input.candidates;
  const candidateById = new Map(effectiveCandidates.map((candidate) => [candidate.id, candidate.item]));
  const hasLearnCandidate = effectiveCandidates.some((candidate) => candidate.item.type === 'learn');
  const hasPracticeCandidate = effectiveCandidates.some((candidate) => candidate.item.type === 'practice');
  const requiresPractice = Boolean(input.requirePracticeItem && hasPracticeCandidate);
  const budgetKey = input.budgetKey || deriveBudgetKeyFromCacheKey(input.cacheKey);

  const heuristicFallback = buildHeuristicPlan({
    candidates: effectiveCandidates,
    maxItems,
    requirePracticeItem: requiresPractice,
    userState: input.userState,
    personalizationProfile: input.personalizationProfile,
    outcomeSignals: input.outcomeSignals,
    recentActivityTitles: input.recentActivityTitles,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logPlannerSelection = (source: string, selected: any[], available: SessionPlannerCandidate[]) => {
    if (!PLANNER_DEBUG_LOGS) return;

    console.info('[session-planner] selection', {
      source,
      selected: selected.map((item) => ({
        href: item.href,
        type: item.type,
        concept: candidateConceptKey(item),
        minutes: item.estMinutes ?? 5,
      })),
      availableTop: available.slice(0, 5).map((candidate) => ({
        id: candidate.id,
        type: candidate.item.type,
        concept: candidateConceptKey(candidate.item),
        minutes: candidate.item.estMinutes ?? 5,
      })),
    });
  };

  const cacheNamespaceKey = input.cacheKey ? `session-plan:v2:${input.cacheKey}` : null;
  if (cacheNamespaceKey) {
    const cached = await getFromCache<SessionPlannerResponse>(cacheNamespaceKey);
    const cachedValidation = validatePlannerResponse(
      cached,
      candidateById,
      maxItems,
      hasLearnCandidate,
      requiresPractice
    );
    if (cachedValidation.valid && cachedValidation.parsed) {
      const cachedItems = finalizeSelectedItems(
        cachedValidation.parsed,
        candidateById,
        effectiveCandidates,
        maxItems,
        requiresPractice
      );
      logPlannerSelection('cache', cachedItems, effectiveCandidates);
      return cachedItems;
    }
  }

  const rankedCandidates = await rankCandidatesStageA({
    budgetKey,
    trackName: input.trackName,
    trackSlug: input.trackSlug,
    candidates: effectiveCandidates,
    userState: input.userState,
    personalizationProfile: input.personalizationProfile,
    outcomeSignals: input.outcomeSignals,
    recentActivityTitles: input.recentActivityTitles,
    practiceTargetDifficulty: input.practiceTargetDifficulty || null,
  });

  const composerCandidates = rankedCandidates.slice(0, Math.max(4, maxItems + 2));
  const compactCandidates = composerCandidates.map((candidate) => ({
    id: candidate.id,
    type: candidate.item.type,
    scope:
      candidate.item.type === 'learn'
        ? (candidate.item.sessionChunkIndex !== undefined ? 'focused_section' : 'full_article')
        : 'practice',
    title: candidate.item.title,
    subtitle: candidate.item.subtitle,
    estMinutes: candidate.item.estMinutes ?? 5,
    confidence: clampConfidence(candidate.item.confidence),
    targetConcept: candidate.item.targetConcept ?? null,
    concepts: candidate.item.primaryConceptSlug ? [candidate.item.primaryConceptSlug] : [],
    articleId: candidate.item.articleId || null,
    sectionId: candidate.item.sessionChunkIndex ?? null,
    intentType: candidate.item.intent.type,
    intentText: candidate.item.intent.text,
    href: candidate.item.href,
    description: candidate.item.practiceQuestionDescription || null,
  }));

  const prompt = buildPlannerPrompt({
    trackName: input.trackName,
    trackSlug: input.trackSlug,
    maxItems,
    requirePracticeItem: !!input.requirePracticeItem,
    hasPracticeCandidate,
    recentActivityTitles: input.recentActivityTitles,
    userState: input.userState,
    personalizationProfile: input.personalizationProfile,
    outcomeSignals: input.outcomeSignals,
    practiceTargetDifficulty: input.practiceTargetDifficulty || null,
    compactCandidates,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bestPlan: any[] | null = null;
  let bestScore = -Infinity;

  for (const modelName of PLANNER_MODEL_FALLBACKS) {
    let retryFeedback = '';

    for (let attempt = 1; attempt <= MAX_PLANNER_ATTEMPTS; attempt += 1) {
      const canSpend = await consumeBudgetCall(budgetKey);
      if (!canSpend) {
        logPlannerSelection('budget-fallback', heuristicFallback, rankedCandidates);
        return heuristicFallback;
      }

      try {
        const response = await plannerClient.responses.create({
          model: modelName,
          reasoning: { effort: PLANNER_REASONING_EFFORT },
          input: [
            {
              role: 'user',
              content: [{
                type: 'input_text',
                text: retryFeedback
                  ? `${prompt}\n\nPrevious output was invalid for these reasons:\n${retryFeedback}\nReturn corrected JSON only.`
                  : prompt,
              }],
            },
          ],
          max_output_tokens: PLANNER_MAX_OUTPUT_TOKENS,
        });

        const raw = extractOutputText(response);
        if (!raw) {
          retryFeedback = '- No output text was produced.';
          continue;
        }

        const parsed = parsePlannerJSON(raw);
        const validation = validatePlannerResponse(
          parsed,
          candidateById,
          maxItems,
          hasLearnCandidate,
          requiresPractice
        );
        if (!validation.valid || !validation.parsed) {
          retryFeedback = validation.errors.map((error) => `- ${error}`).join('\n');
          continue;
        }

        const finalItems = finalizeSelectedItems(
          validation.parsed,
          candidateById,
          composerCandidates,
          maxItems,
          requiresPractice
        );
        if (finalItems.length === 0) {
          retryFeedback = '- Output produced zero usable selections.';
          continue;
        }

        const ambitiousItems = widenThinPlan(finalItems, rankedCandidates, maxItems, 22);
        const finalScore = scorePlan(
          ambitiousItems,
          rankedCandidates,
          input.outcomeSignals,
          input.userState,
          input.personalizationProfile
        );
        if (finalScore > bestScore) {
          bestPlan = ambitiousItems;
          bestScore = finalScore;
        }

        if (cacheNamespaceKey) {
          await setInCache(cacheNamespaceKey, validation.parsed, getCacheTTLSeconds());
        }

        logPlannerSelection('llm', ambitiousItems, rankedCandidates);
        return ambitiousItems;
      } catch (error) {
        console.error(`LLM session planning failed on attempt ${attempt}:`, error);
        retryFeedback = '- Request failed unexpectedly. Return valid JSON with candidate IDs only.';
      }
    }
  }

  const fallbackPlan = bestPlan || heuristicFallback;
  logPlannerSelection(bestPlan ? 'best-model' : 'heuristic-fallback', fallbackPlan, rankedCandidates);
  return fallbackPlan;
}
