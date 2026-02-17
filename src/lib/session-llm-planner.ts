import OpenAI from 'openai';
import type { SessionIntent, SessionItem } from '@/lib/progress';
import type { UserLearningState } from '@/types/micro';
import { getFromCache, setInCache } from '@/lib/redis';
import { sanitizeIntentText } from '@/lib/intent-display';
import type { SessionPersonalizationProfile } from '@/lib/session-personalization';

export interface SessionPlannerCandidate {
  id: string;
  item: SessionItem;
}

interface SessionPlannerInput {
  cacheKey?: string;
  budgetKey?: string;
  trackSlug: string;
  trackName: string;
  userState: UserLearningState | null;
  personalizationProfile?: SessionPersonalizationProfile | null;
  recentActivityTitles: string[];
  outcomeSignals?: PlannerOutcomeSignals;
  practiceTargetDifficulty?: 'Easy' | 'Medium' | 'Hard' | null;
  requirePracticeItem?: boolean;
  candidates: SessionPlannerCandidate[];
  maxItems?: number;
}

interface PlannerOutcomeSignals {
  completionRate: number;
  timeAdherence: number;
  nextDayReturnRate: number;
  ritualQuality: number;
}

interface SessionPlannerSelection {
  id: string;
  intentType?: SessionIntent['type'];
  intentText?: string;
  targetConcept?: string;
}

interface SessionPlannerResponse {
  selected: SessionPlannerSelection[];
}

const plannerClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const VALID_INTENT_TYPES = new Set<SessionIntent['type']>([
  'foundation',
  'bridge',
  'tradeoff',
  'practice',
]);
const MAX_PLANNER_ATTEMPTS = resolvePlannerAttempts(process.env.OPENAI_SESSION_PLANNER_MAX_ATTEMPTS);
const PLANNER_MAX_OUTPUT_TOKENS = resolvePlannerMaxOutputTokens(process.env.OPENAI_SESSION_PLANNER_MAX_OUTPUT_TOKENS);
const PLANNER_MODEL_FALLBACKS = resolvePlannerModels();
const PLANNER_RANKER_MODEL = resolveRankerModel(process.env.OPENAI_SESSION_PLANNER_RANKER_MODEL);
const PLANNER_DAILY_CALL_BUDGET = resolvePlannerDailyCallBudget(process.env.OPENAI_SESSION_PLANNER_DAILY_CALL_BUDGET);
const PLANNER_REASONING_EFFORT = resolveReasoningEffort(process.env.OPENAI_SESSION_PLANNER_REASONING_EFFORT);
const EXPLOITATION_RATIO = 0.7;
const PLANNER_DEBUG_LOGS = process.env.OPENAI_SESSION_PLANNER_DEBUG === 'true';
const CONCEPT_PREREQUISITES: Record<string, string[]> = {
  arrays: [],
  strings: [],
  hash_maps: ['arrays'],
  stack: ['arrays'],
  queues: ['arrays'],
  linked_lists: ['arrays'],
  trees: ['arrays'],
  heaps: ['trees'],
  tries: ['trees', 'strings'],
  binary_search_trees: ['trees'],
  segment_trees: ['trees'],
  sparse_tables: ['arrays'],
  graphs: ['trees'],
};
const CONCEPT_ALIASES: Record<string, string> = {
  hash_map: 'hash_maps',
  hash_maps_and_sets: 'hash_maps',
  stack: 'stack',
  stacks: 'stack',
  queue: 'queues',
  linked_list: 'linked_lists',
  linked_lists: 'linked_lists',
  tree: 'trees',
  trees: 'trees',
  trie: 'tries',
  tries: 'tries',
  segment_tree: 'segment_trees',
  segment_trees: 'segment_trees',
  sparse_table: 'sparse_tables',
  graph: 'graphs',
  arrays: 'arrays',
  strings: 'strings',
  heap: 'heaps',
  heaps: 'heaps',
};

export async function planSessionItemsWithLLM(input: SessionPlannerInput): Promise<SessionItem[] | null> {
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
  const logPlannerSelection = (source: string, selected: SessionItem[], available: SessionPlannerCandidate[]) => {
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
      const cachedPlan = rebalanceExplorationMix(
        cachedItems,
        effectiveCandidates,
        input.userState,
        maxItems,
        22
      );
      logPlannerSelection('cache', cachedPlan, effectiveCandidates);
      return cachedPlan;
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

  let bestPlan: SessionItem[] | null = null;
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

        const ambitiousItems = widenThinPlan(
          finalItems,
          rankedCandidates,
          maxItems,
          22
        );
        const balancedItems = rebalanceExplorationMix(
          ambitiousItems,
          rankedCandidates,
          input.userState,
          maxItems,
          22
        );
        const finalScore = scorePlan(
          balancedItems,
          rankedCandidates,
          input.outcomeSignals,
          input.userState,
          input.personalizationProfile
        );
        if (finalScore > bestScore) {
          bestPlan = balancedItems;
          bestScore = finalScore;
        }

        if (cacheNamespaceKey) {
          await setInCache(cacheNamespaceKey, validation.parsed, secondsUntilNextUTCDay());
        }

        logPlannerSelection('llm', balancedItems, rankedCandidates);
        return balancedItems;
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

function extractOutputText(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;

  const outputText = (response as { output_text?: unknown }).output_text;
  if (typeof outputText === 'string' && outputText.trim().length > 0) {
    return outputText.trim();
  }

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    const joined = content
      .map((part) => (typeof (part as { text?: unknown }).text === 'string' ? (part as { text: string }).text : ''))
      .join(' ')
      .trim();

    if (joined) return joined;
  }

  return null;
}

function parsePlannerJSON(raw: string): SessionPlannerResponse | null {
  const trimmed = stripCodeFences(raw).trim();

  try {
    return JSON.parse(trimmed) as SessionPlannerResponse;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as SessionPlannerResponse;
    } catch {
      return null;
    }
  }
}

interface RankerResponse {
  rankedIds: string[];
}

async function rankCandidatesStageA(input: {
  budgetKey: string | null;
  trackSlug: string;
  trackName: string;
  candidates: SessionPlannerCandidate[];
  userState: UserLearningState | null;
  personalizationProfile?: SessionPersonalizationProfile | null;
  outcomeSignals?: PlannerOutcomeSignals;
  recentActivityTitles: string[];
  practiceTargetDifficulty: 'Easy' | 'Medium' | 'Hard' | null;
}): Promise<SessionPlannerCandidate[]> {
  const heuristicRanked = rankCandidatesHeuristically(
    input.candidates,
    input.userState,
    input.outcomeSignals,
    input.recentActivityTitles,
    input.personalizationProfile
  );
  if (!plannerClient || input.candidates.length <= 3) {
    return heuristicRanked;
  }

  const canSpend = await consumeBudgetCall(input.budgetKey);
  if (!canSpend) {
    return heuristicRanked;
  }

  const compactCandidates = input.candidates.map((candidate) => ({
    id: candidate.id,
    type: candidate.item.type,
    title: candidate.item.title,
    estMinutes: candidate.item.estMinutes ?? 5,
    confidence: clampConfidence(candidate.item.confidence),
    targetConcept: candidate.item.targetConcept ?? null,
  }));

  const prompt = [
    'Rank candidate session items by learning leverage.',
    `Track: ${input.trackName} (${input.trackSlug})`,
    'Return strict JSON only: {"rankedIds":["id1","id2",...]}',
    'Rules:',
    '- Use only IDs from candidates.',
    '- No duplicates.',
    '- Keep highest leverage first.',
    '- Prefer a mix of learn and practice when available.',
    `Recent activity: ${input.recentActivityTitles.join(' | ') || 'none'}`,
    `Stubborn concepts: ${input.userState?.stubbornConcepts.join(', ') || 'none'}`,
    `Recent concepts: ${input.userState?.recentConcepts.join(', ') || 'none'}`,
    `Outcome signals: ${formatOutcomeSignals(input.outcomeSignals)}`,
    `Personalization profile: ${formatPersonalizationProfile(input.personalizationProfile)}`,
    `Practice target difficulty: ${input.practiceTargetDifficulty || 'none'}`,
    `Candidates: ${JSON.stringify(compactCandidates)}`,
  ].join('\n');

  try {
    const response = await plannerClient.responses.create({
      model: PLANNER_RANKER_MODEL,
      reasoning: { effort: 'minimal' },
      input: [{
        role: 'user',
        content: [{ type: 'input_text', text: prompt }],
      }],
      max_output_tokens: 220,
    });

    const raw = extractOutputText(response);
    if (!raw) return heuristicRanked;
    const parsed = parseRankerJSON(raw);
    if (!parsed || !Array.isArray(parsed.rankedIds)) return heuristicRanked;

    const orderedIds = new Set<string>();
    const rankedByModel: SessionPlannerCandidate[] = [];
    const byId = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));

    for (const id of parsed.rankedIds) {
      if (typeof id !== 'string' || orderedIds.has(id)) continue;
      const match = byId.get(id);
      if (!match) continue;
      orderedIds.add(id);
      rankedByModel.push(match);
    }

    for (const fallback of heuristicRanked) {
      if (orderedIds.has(fallback.id)) continue;
      rankedByModel.push(fallback);
    }

    return rankedByModel;
  } catch (error) {
    console.error('Stage A ranker failed:', error);
    return heuristicRanked;
  }
}

function parseRankerJSON(raw: string): RankerResponse | null {
  const trimmed = stripCodeFences(raw).trim();
  try {
    return JSON.parse(trimmed) as RankerResponse;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as RankerResponse;
    } catch {
      return null;
    }
  }
}

function stripCodeFences(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) {
    return fenced[1];
  }
  return raw;
}

function normalizeIntentType(value: SessionIntent['type'] | undefined, fallback: SessionIntent['type']): SessionIntent['type'] {
  if (value && VALID_INTENT_TYPES.has(value)) return value;
  return fallback;
}

function normalizeIntentText(value: string | undefined, fallback: string, title: string): string {
  const cleaned = value?.trim();
  if (!cleaned || cleaned.length < 24 || cleaned.length > 180 || !/because/i.test(cleaned)) {
    return sanitizeIntentText(fallback, { title, maxChars: 140, minChars: 24 });
  }
  return sanitizeIntentText(cleaned, { fallback, title, maxChars: 140, minChars: 24 });
}

function normalizeTargetConcept(value: string | undefined, fallback: string | null | undefined): string | null {
  const cleaned = value?.trim();
  if (cleaned && cleaned.length >= 3 && cleaned.length <= 60) {
    return cleaned;
  }
  return fallback?.trim() || null;
}

function enforceAtLeastOneLearn(
  selectedItems: SessionItem[],
  candidates: SessionPlannerCandidate[],
  maxItems: number
): SessionItem[] {
  const hasLearn = selectedItems.some((item) => item.type === 'learn');
  if (hasLearn) return selectedItems;

  const firstLearn = candidates.find((candidate) => candidate.item.type === 'learn')?.item;
  if (!firstLearn) return selectedItems;

  const next = [firstLearn, ...selectedItems];
  return next.slice(0, maxItems);
}

function capTotalMinutes(items: SessionItem[], maxMinutes: number): SessionItem[] {
  const capped: SessionItem[] = [];
  let totalMinutes = 0;

  for (const item of items) {
    const minutes = item.estMinutes ?? 5;
    if (capped.length > 0 && totalMinutes + minutes > maxMinutes) {
      continue;
    }
    capped.push(item);
    totalMinutes += minutes;
  }

  return capped.slice(0, 3);
}

function validatePlannerResponse(
  parsed: unknown,
  candidates: Map<string, SessionItem>,
  maxItems: number,
  requiresLearn: boolean,
  requiresPractice: boolean
): { valid: boolean; parsed: SessionPlannerResponse | null; errors: string[] } {
  const errors: string[] = [];

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, parsed: null, errors: ['Payload is not a JSON object.'] };
  }

  const selected = (parsed as { selected?: unknown }).selected;
  if (!Array.isArray(selected)) {
    return { valid: false, parsed: null, errors: ['`selected` must be an array.'] };
  }

  if (selected.length === 0) {
    errors.push('`selected` cannot be empty.');
  }
  if (selected.length > maxItems) {
    errors.push('`selected` has too many items.');
  }

  const seen = new Set<string>();
  let selectedLearnCount = 0;
  let selectedPracticeCount = 0;

  for (const row of selected) {
    if (!row || typeof row !== 'object') {
      errors.push('Each selection must be an object.');
      continue;
    }

    const id = (row as { id?: unknown }).id;
    if (typeof id !== 'string' || id.trim().length === 0) {
      errors.push('Each selection requires a non-empty string id.');
      continue;
    }

    if (!candidates.has(id)) {
      errors.push(`Selection id "${id}" is not in candidates.`);
      continue;
    }

    if (seen.has(id)) {
      errors.push(`Selection id "${id}" is duplicated.`);
    }
    seen.add(id);

    const candidate = candidates.get(id);
    if (candidate?.type === 'learn') {
      selectedLearnCount += 1;
    }
    if (candidate?.type === 'practice') {
      selectedPracticeCount += 1;
    }

    const intentType = (row as { intentType?: unknown }).intentType;
    if (intentType !== undefined && (typeof intentType !== 'string' || !VALID_INTENT_TYPES.has(intentType as SessionIntent['type']))) {
      errors.push(`Selection id "${id}" has invalid intentType.`);
    }

    const intentText = (row as { intentText?: unknown }).intentText;
    if (intentText !== undefined && (typeof intentText !== 'string' || intentText.trim().length < 24 || intentText.trim().length > 180)) {
      errors.push(`Selection id "${id}" has invalid intentText length.`);
    }
    if (typeof intentText === 'string' && !/because/i.test(intentText)) {
      errors.push(`Selection id "${id}" intentText must include a causal reason.`);
    }

    const targetConcept = (row as { targetConcept?: unknown }).targetConcept;
    if (targetConcept !== undefined && (typeof targetConcept !== 'string' || targetConcept.trim().length < 3 || targetConcept.trim().length > 60)) {
      errors.push(`Selection id "${id}" has invalid targetConcept.`);
    }
  }

  if (requiresLearn && selectedLearnCount === 0) {
    errors.push('Plan must include at least one learn item.');
  }
  if (requiresPractice && selectedPracticeCount === 0) {
    errors.push('Plan must include at least one practice item.');
  }

  return {
    valid: errors.length === 0,
    parsed: errors.length === 0 ? (parsed as SessionPlannerResponse) : null,
    errors,
  };
}

export function applySessionPlanPolicySelection(input: {
  selectedIds: string[];
  candidates: SessionPlannerCandidate[];
  maxItems: number;
  requirePracticeItem: boolean;
}): SessionItem[] {
  const boundedMaxItems = Math.min(Math.max(input.maxItems, 1), 4);
  const parsed: SessionPlannerResponse = {
    selected: input.selectedIds.map((id) => ({ id })),
  };
  const candidateById = new Map(input.candidates.map((candidate) => [candidate.id, candidate.item]));
  return finalizeSelectedItems(
    parsed,
    candidateById,
    input.candidates,
    boundedMaxItems,
    input.requirePracticeItem
  );
}

function finalizeSelectedItems(
  parsed: SessionPlannerResponse,
  candidateById: Map<string, SessionItem>,
  candidates: SessionPlannerCandidate[],
  maxItems: number,
  requirePracticeItem: boolean
): SessionItem[] {
  const uniqueIds = new Set<string>();
  const selectedItems: SessionItem[] = [];

  for (const selection of parsed.selected.slice(0, maxItems)) {
    if (!selection?.id || uniqueIds.has(selection.id)) continue;
    const candidate = candidateById.get(selection.id);
    if (!candidate) continue;
    uniqueIds.add(selection.id);

    const nextIntentType = normalizeIntentType(selection.intentType, candidate.intent.type);
    const nextIntentText = normalizeIntentText(selection.intentText, candidate.intent.text, candidate.title);
    const nextTargetConcept = normalizeTargetConcept(selection.targetConcept, candidate.targetConcept);

    selectedItems.push({
      ...candidate,
      targetConcept: nextTargetConcept,
      intent: {
        ...candidate.intent,
        type: nextIntentType,
        text: nextIntentText,
      },
    });
  }

  const withLearnGuard = enforceAtLeastOneLearn(selectedItems, candidates, maxItems);
  const diversified = enforcePlanDiversity(withLearnGuard, candidates, maxItems, 22);
  const capped = capTotalMinutes(diversified, 22);
  const guarded = requirePracticeItem
    ? enforceAtLeastOnePractice(capped, candidates, maxItems, 22)
    : capped;
  return enforcePlanDiversity(guarded, candidates, maxItems, 22);
}

function enforceAtLeastOnePractice(
  selectedItems: SessionItem[],
  candidates: SessionPlannerCandidate[],
  maxItems: number,
  maxMinutes: number
): SessionItem[] {
  if (selectedItems.some((item) => item.type === 'practice')) {
    return selectedItems;
  }

  const fallbackPractice = candidates.find((candidate) => candidate.item.type === 'practice')?.item;
  if (!fallbackPractice) return selectedItems;

  const currentMinutes = selectedItems.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0);
  const practiceMinutes = fallbackPractice.estMinutes ?? 5;

  if (selectedItems.length < maxItems && currentMinutes + practiceMinutes <= maxMinutes) {
    return [...selectedItems, fallbackPractice];
  }

  const mutable = [...selectedItems];
  while (mutable.length > 0 && (mutable.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0) + practiceMinutes > maxMinutes || mutable.length >= maxItems)) {
    mutable.pop();
  }

  return [...mutable, fallbackPractice].slice(0, maxItems);
}

function secondsUntilNextUTCDay(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(60, Math.floor((next.getTime() - now.getTime()) / 1000));
}

async function consumeBudgetCall(budgetKey: string | null): Promise<boolean> {
  if (!budgetKey) return true;
  const cacheKey = `session-plan-budget:v1:${budgetKey}`;
  const current = await getFromCache<{ calls: number }>(cacheKey);
  const calls = current?.calls ?? 0;
  if (calls >= PLANNER_DAILY_CALL_BUDGET) return false;
  await setInCache(cacheKey, { calls: calls + 1 }, secondsUntilNextUTCDay());
  return true;
}

function deriveBudgetKeyFromCacheKey(cacheKey?: string): string | null {
  if (!cacheKey) return null;
  const parts = cacheKey.split(':');
  if (parts.length < 3) return null;
  return `${parts[0]}:${parts[2]}`;
}

function applySkillFrontierGating(
  candidates: SessionPlannerCandidate[],
  userState: UserLearningState | null,
  trackSlug: string
): SessionPlannerCandidate[] {
  if (trackSlug !== 'dsa') return candidates;

  const learned = new Set<string>();
  for (const concept of userState?.recentConcepts || []) {
    const normalized = normalizeConceptKey(concept);
    if (normalized) learned.add(normalized);
  }
  const lastConcept = normalizeConceptKey(userState?.lastInternalization?.conceptSlug);
  if (lastConcept) learned.add(lastConcept);

  const baseline = new Set(['arrays', 'strings']);
  if (learned.size === 0) {
    for (const key of baseline) learned.add(key);
  }

  const eligible: SessionPlannerCandidate[] = [];
  for (const candidate of candidates) {
    if (candidate.item.type !== 'learn') {
      eligible.push(candidate);
      continue;
    }

    const concept = candidateConceptKey(candidate.item);
    if (!concept) {
      eligible.push(candidate);
      continue;
    }

    const prereqs = CONCEPT_PREREQUISITES[concept];
    if (!prereqs || prereqs.length === 0) {
      eligible.push(candidate);
      continue;
    }

    const hasPrereq = prereqs.some((req) => learned.has(req));
    if (hasPrereq || learned.has(concept)) {
      eligible.push(candidate);
    }
  }

  const learnCount = eligible.filter((candidate) => candidate.item.type === 'learn').length;
  return learnCount >= 2 ? eligible : candidates;
}

function candidateConceptKey(item: SessionItem): string | null {
  return normalizeConceptKey(item.primaryConceptSlug || item.targetConcept || item.title);
}

function normalizeConceptKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const trailing = value.split('.').pop() || value;
  const normalized = trailing
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!normalized) return null;
  return CONCEPT_ALIASES[normalized] || normalized;
}

function normalizeTitleTokens(value: string): Set<string> {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!normalized) return new Set();
  return new Set(normalized.split(/\s+/).filter((part) => part.length > 1));
}

function titleSimilarity(a: string, b: string): number {
  const aTokens = normalizeTitleTokens(a);
  const bTokens = normalizeTitleTokens(b);
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }

  const denominator = Math.max(aTokens.size, bTokens.size);
  return denominator > 0 ? overlap / denominator : 0;
}

export function highestTitleSimilarity(title: string, recentTitles: string[]): number {
  if (recentTitles.length === 0) return 0;
  let best = 0;
  for (const recent of recentTitles) {
    best = Math.max(best, titleSimilarity(title, recent));
  }
  return best;
}

export function rankCandidatesHeuristically(
  candidates: SessionPlannerCandidate[],
  userState: UserLearningState | null,
  outcomeSignals?: PlannerOutcomeSignals,
  recentActivityTitles: string[] = [],
  personalizationProfile?: SessionPersonalizationProfile | null
): SessionPlannerCandidate[] {
  return [...candidates].sort((a, b) => {
    const scoreA = heuristicCandidateScore(
      a.item,
      userState,
      outcomeSignals,
      recentActivityTitles,
      personalizationProfile
    );
    const scoreB = heuristicCandidateScore(
      b.item,
      userState,
      outcomeSignals,
      recentActivityTitles,
      personalizationProfile
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
  personalizationProfile?: SessionPersonalizationProfile | null
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

  return score;
}

export function buildHeuristicPlan(input: {
  candidates: SessionPlannerCandidate[];
  maxItems: number;
  requirePracticeItem: boolean;
  userState: UserLearningState | null;
  personalizationProfile?: SessionPersonalizationProfile | null;
  outcomeSignals?: PlannerOutcomeSignals;
  recentActivityTitles?: string[];
}): SessionItem[] {
  const ranked = rankCandidatesHeuristically(
    input.candidates,
    input.userState,
    input.outcomeSignals,
    input.recentActivityTitles || [],
    input.personalizationProfile
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

  const withLearn = enforceAtLeastOneLearn(
    selected,
    input.candidates,
    input.maxItems
  );
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

function formatOutcomeSignals(outcomeSignals?: PlannerOutcomeSignals): string {
  if (!outcomeSignals) return 'none';
  return JSON.stringify({
    completionRate: clamp01(outcomeSignals.completionRate),
    timeAdherence: clamp01(outcomeSignals.timeAdherence),
    nextDayReturnRate: clamp01(outcomeSignals.nextDayReturnRate),
    ritualQuality: clamp01(outcomeSignals.ritualQuality),
  });
}

function formatPersonalizationProfile(profile?: SessionPersonalizationProfile | null): string {
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

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function resolvePlannerModels(): string[] {
  const raw = process.env.OPENAI_SESSION_PLANNER_MODELS;
  if (!raw) {
    return ['gpt-5-mini', 'gpt-5-nano'];
  }

  const models = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return models.length > 0 ? models : ['gpt-5-mini', 'gpt-5-nano'];
}

function resolveRankerModel(value: string | undefined): string {
  return value?.trim() || 'gpt-5-nano';
}

function resolvePlannerDailyCallBudget(value: string | undefined): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(1, Math.min(200, Math.floor(parsed)));
  }
  return 10;
}

function resolveReasoningEffort(value: string | undefined): 'minimal' | 'low' | 'medium' | 'high' {
  if (value === 'minimal' || value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  return 'minimal';
}

function resolvePlannerAttempts(value: string | undefined): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(1, Math.min(3, Math.floor(parsed)));
  }
  return 1;
}

function resolvePlannerMaxOutputTokens(value: string | undefined): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(200, Math.min(900, Math.floor(parsed)));
  }
  return 320;
}

function clampConfidence(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function formatLastInternalization(userState: UserLearningState | null): string {
  if (!userState?.lastInternalization) return 'none';
  const { conceptSlug, picked } = userState.lastInternalization;
  return `${conceptSlug} (${picked})`;
}

function widenThinPlan(
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

function scorePlan(
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

interface CompactCandidate {
  id: string;
  type: string;
  scope: string;
  title: string;
  subtitle: string | null;
  estMinutes: number;
  confidence: number;
  targetConcept: string | null;
  concepts: string[];
  articleId: string | null;
  sectionId: number | null;
  intentType: string;
  intentText: string;
  href: string;
  description: string | null;
}

interface PromptInput {
  trackName: string;
  trackSlug: string;
  maxItems: number;
  requirePracticeItem: boolean;
  hasPracticeCandidate: boolean;
  recentActivityTitles: string[];
  userState: UserLearningState | null;
  personalizationProfile?: SessionPersonalizationProfile | null;
  outcomeSignals?: PlannerOutcomeSignals;
  practiceTargetDifficulty: string | null;
  compactCandidates: CompactCandidate[];
}

export function buildPlannerPrompt(input: PromptInput): string {
  return [
    'You are selecting a short personalized learning session plan.',
    `Track: ${input.trackName} (${input.trackSlug}).`,
    `Pick 2-${input.maxItems} items from the candidate list, but pick 1 item if quality is low.`,
    'Prefer mixing learn + practice when practice is relevant.',
    'When focused sections are available, prefer mixing sections from different articles over rereading full articles.',
    'Optimize for highest learning leverage in the next 20 minutes.',
    'Pick a concrete and ambitious next step, not a safe generic step.',
    'Hard constraints:',
    '- Only use candidate IDs exactly as provided.',
    '- No duplicate IDs.',
    '- Keep total estimated time <= 22 minutes.',
    '- If learn items exist, include at least one learn item.',
    ...(input.requirePracticeItem && input.hasPracticeCandidate
      ? ['- Include at least one practice item.']
      : []),
    '- Keep intent text causal and concrete (must include "because").',
    '- Avoid motivational fluff.',
    'Return strict JSON only with this shape:',
    '{"selected":[{"id":"candidate-id","intentType":"foundation|bridge|tradeoff|practice","intentText":"one concise causal sentence","targetConcept":"short concept label"}]}',
    'intentText must explain why this item is next and stay under 140 chars.',
    'targetConcept should be a clear label like "Pointer invariants" or "Medium interview problem solving".',
    '',
    `Recent activity titles: ${input.recentActivityTitles.join(' | ') || 'none'}`,
    `User stubborn concepts: ${input.userState?.stubbornConcepts.join(', ') || 'none'}`,
    `User recent concepts: ${input.userState?.recentConcepts.join(', ') || 'none'}`,
    `User failure modes: ${JSON.stringify(input.userState?.failureModes || [])}`,
    `User aggregate history: ${input.userState?.aggregateHistory.join(' | ') || 'none'}`,
    `Last internalization: ${formatLastInternalization(input.userState)}`,
    `Outcome signals: ${formatOutcomeSignals(input.outcomeSignals)}`,
    `Personalization profile: ${formatPersonalizationProfile(input.personalizationProfile)}`,
    `Practice target difficulty: ${input.practiceTargetDifficulty || 'none'}`,
    `Policy: target ${Math.round(EXPLOITATION_RATIO * 100)}% exploit (weak/recent/struggling concepts) and ${Math.round((1 - EXPLOITATION_RATIO) * 100)}% explore (new concepts) when feasible.`,
    '',
    'Decision rubric (must follow):',
    '- Score each candidate: leverage (0-3) + fit_to_failure_modes (0-3) + novelty (0-2) - redundancy (0-3) - time_risk (0-2).',
    '- leverage: how much skill gain per minute.',
    '- fit_to_failure_modes: directly addresses listed failure modes / stubborn concepts.',
    '- novelty: not in recentActivityTitles/recentConcepts.',
    '- redundancy: same article/concept as recent activity OR overlaps another selected item.',
    '- time_risk: likely to exceed its estimate or cause context switching.',
    '- Select highest total scores subject to constraints.',
    '',
    'Quality gating:',
    '- "Quality is low" ONLY if: (max candidate score <= 2) OR (no candidate matches failure modes/stubborn concepts AND no strong new concept exists).',
    '- If quality is low, select exactly 1 best candidate and set intentText to explain the limitation.',
    '',
    'Selection hygiene:',
    '- Before returning JSON, internally compute scores for ALL candidates and select the highest-scoring set.',
    '- If you cannot compute scores from provided fields, treat missing data as 0 and explain via intentText.',
    '',
    'Diversity & Selection rules:',
    '- If selecting 2+ items: ensure at least 2 distinct targetConcepts.',
    '- Avoid selecting 2 items from the same article unless they are different sections with clearly different targetConcepts.',
    '- If requirePracticeItem is true, practice must target a failure mode or stubborn concept when possible.',
    '- If candidates include focused_sections, prefer selecting them unless a full_article score is higher by >= 2.',
    '- Redundancy is HIGH (-3) if articleId matches a recentActivityTitles item or another selected item and targetConcept overlaps.',
    '- Redundancy is MED (-2) if candidate concepts overlap recentConcepts or stubbornConcepts but does not directly target the failure mode.',
    '',
    'Intent & Output rules:',
    '- Order selected items in the exact sequence the user should do them (highest dependency first).',
    '- intentText must reference either a failure mode/stubborn concept OR a specific gap implied by recent activity, and include "because".',
    '- intentType must be consistent: practice only if it is an actual practice item; bridge requires from->to style rationale; tradeoff only if it’s explicitly a tradeoff.',
    '',
    `Candidates: ${JSON.stringify(input.compactCandidates)}`,
  ].join('\n');
}
