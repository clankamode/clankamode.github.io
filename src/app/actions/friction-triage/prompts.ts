import OpenAI from 'openai';
import { decideFrictionTriagePolicy } from '@/lib/ai-policy/runtime';
import type { FrictionState, FrictionTriageStatus } from '@/types/friction';
import type { BriefEvidence, OpenAIResponse } from './types';
import { MAX_OWNER_LENGTH } from './constants';
import { extractOutputText, normalizeRecommendedStatus, parseRecommendationText, normalizeText } from './utils';

const TRIAGE_BRIEF_FALLBACK_PREFIX = 'Observed: ';

export async function generateTriageBrief(
  evidence: BriefEvidence
): Promise<{ generatedBrief: string; model: 'gpt-5-nano' | 'deterministic-fallback' }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      generatedBrief: [
        `${TRIAGE_BRIEF_FALLBACK_PREFIX}${Math.round(evidence.stuckRate * 100)}% stuck over ${evidence.sampleSize} snapshots across ${evidence.uniqueSessions} sessions.`,
        `Likely causes: avg elapsed ratio ${evidence.averageElapsedRatio.toFixed(2)}x estimate; avg blocked count ${evidence.averagePracticeBlockedCount.toFixed(2)}; avg chunk toggles ${evidence.averageChunkToggleCount.toFixed(2)}.`,
        `Next action: assign owner, inspect 3 newest sessions, and test whether estimate/step framing should be adjusted.`,
      ].join('\n'),
      model: 'deterministic-fallback',
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = [
    'You are assisting an admin triage queue for learning-session friction.',
    'Write a concise triage brief with exactly three labeled lines:',
    '1) Observed:',
    '2) Likely causes:',
    '3) Next action:',
    'Do not use markdown bullets. Keep total under 650 characters. Plain text only.',
  ].join('\n');
  const response = await openai.responses.create({
    model: 'gpt-5-nano',
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: prompt },
          { type: 'input_text', text: JSON.stringify(evidence) },
        ],
      },
    ],
    max_output_tokens: 320,
  });

  return {
    generatedBrief:
      extractOutputText(response as OpenAIResponse) ||
      'Observed: Not enough signal.\nLikely causes: Unknown.\nNext action: Review latest sessions manually.',
    model: 'gpt-5-nano',
  };
}

export async function runPolicyTriageDecision(input: {
  trackSlug: string;
  stepIndex: number;
  lookbackDays: number;
  sampleSize: number;
  stuckRate: number;
  avgConfidence: number;
  avgElapsedRatio: number;
  ownerCandidates: string[];
  existingStatus: FrictionTriageStatus;
  existingOwner: string | null;
  dominantState: FrictionState | 'none';
  fallbackStatus: FrictionTriageStatus;
  fallbackOwner: string | null;
  fallbackRationale: string;
}) {
  const policyDecision = await decideFrictionTriagePolicy({
    trackSlug: input.trackSlug,
    stepIndex: input.stepIndex,
    lookbackDays: input.lookbackDays,
    sampleSize: input.sampleSize,
    stuckRate: input.stuckRate,
    avgConfidence: input.avgConfidence,
    avgElapsedRatio: input.avgElapsedRatio,
    ownerCandidates: input.ownerCandidates,
    existingStatus: input.existingStatus,
    existingOwner: input.existingOwner,
    dominantState: input.dominantState,
    fallbackOutput: {
      status: input.fallbackStatus,
      owner: input.fallbackOwner,
      rationale: input.fallbackRationale,
    },
  });

  return {
    status: policyDecision.output.status,
    owner: policyDecision.output.owner ?? input.fallbackOwner,
    rationale: policyDecision.output.rationale,
    model: policyDecision.model,
    fallbackUsed: policyDecision.fallbackUsed,
    latencyMs: policyDecision.latencyMs,
    errorCode: policyDecision.errorCode === 'none' ? null : policyDecision.errorCode,
  };
}

export async function generateOpenAIRecommendation(input: {
  trackSlug: string;
  stepIndex: number;
  lookbackDays: number;
  sampleSize: number;
  stuckRate: number;
  avgConfidence: number;
  avgElapsedRatio: number;
  existingStatus: FrictionTriageStatus;
  existingOwner: string | null;
  ownerCandidates: string[];
  fallbackStatus: FrictionTriageStatus;
  fallbackOwner: string | null;
  fallbackRationale: string;
}) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = [
    'Recommend triage assignment for a hotspot.',
    'Return JSON only with keys: status, owner, rationale.',
    'status must be one of: new, investigating, resolved.',
    'owner must be either one of ownerCandidates or null.',
    'Keep rationale under 180 characters.',
  ].join('\n');

  const response = await openai.responses.create({
    model: 'gpt-5-nano',
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: prompt },
          {
            type: 'input_text',
            text: JSON.stringify({
              hotspot: {
                trackSlug: input.trackSlug,
                stepIndex: input.stepIndex,
                lookbackDays: input.lookbackDays,
                sampleSize: input.sampleSize,
                stuckRate: input.stuckRate,
                avgConfidence: input.avgConfidence,
                avgElapsedRatio: input.avgElapsedRatio,
              },
              existing: { status: input.existingStatus, owner: input.existingOwner },
              ownerCandidates: input.ownerCandidates,
            }),
          },
        ],
      },
    ],
    max_output_tokens: 220,
  });

  const parsed = parseRecommendationText(extractOutputText(response as OpenAIResponse) || '');
  if (parsed) {
    const parsedOwner = normalizeText(parsed.owner ?? null, MAX_OWNER_LENGTH)?.toLowerCase() ?? null;
    const recommendedOwner = parsedOwner && input.ownerCandidates.includes(parsedOwner) ? parsedOwner : input.fallbackOwner;
    return {
      status: normalizeRecommendedStatus(parsed.status, input.fallbackStatus),
      owner: recommendedOwner,
      rationale: parsed.rationale?.trim() ? parsed.rationale.trim().slice(0, 240) : input.fallbackRationale,
      model: 'gpt-5-nano' as const,
      fallbackUsed: false,
      errorCode: null,
    };
  }

  return {
    status: input.fallbackStatus,
    owner: input.fallbackOwner,
    rationale: input.fallbackRationale,
    model: 'gpt-5-nano' as const,
    fallbackUsed: true,
    errorCode: 'parse_failed',
  };
}
