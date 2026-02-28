import { PLANNER_RANKER_MODEL, plannerClient } from '@/lib/session-llm-planner/config';
import { clampConfidence, formatOutcomeSignals, formatPersonalizationProfile } from '@/lib/session-llm-planner/formatting';
import { rankCandidatesHeuristically } from '@/lib/session-llm-planner/heuristic-ranking';
import { consumeBudgetCall } from '@/lib/session-llm-planner/llm-budget';
import { parseRankerJSON } from '@/lib/session-llm-planner/validation';
import type { PlannerOutcomeSignals, SessionPlannerCandidate } from '@/lib/session-llm-planner/types';
import type { UserLearningState } from '@/types/micro';
import type { SessionPersonalizationProfile } from '@/lib/session-personalization';

export function extractOutputText(response: unknown): string | null {
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

export async function rankCandidatesStageA(input: {
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
