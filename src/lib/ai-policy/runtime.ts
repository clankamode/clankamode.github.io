import OpenAI from 'openai';
import {
  buildFrictionTriagePolicyPrompt,
  buildOnboardingPathPolicyPrompt,
  buildScopePolicyPrompt,
  buildSessionPlanPolicyPrompt,
} from '@/lib/ai-policy/prompts';
import type {
  AIPolicyErrorCode,
  FrictionTriageDecisionOutput,
  OnboardingPathDecisionOutput,
  PolicyDecisionEnvelope,
  ScopePolicyDecisionOutput,
  SessionPlanDecisionOutput,
} from '@/lib/ai-policy/types';
import {
  AI_POLICY_CONFIDENCE_THRESHOLD,
  AI_POLICY_FALLBACK_MODEL,
  AI_POLICY_PRIMARY_MODEL,
  AI_POLICY_TIMEOUT_MS,
} from '@/lib/ai-policy/types';
import {
  parseJsonOutput,
  validateFrictionTriageDecision,
  validateOnboardingPathDecision,
  validateScopePolicyDecision,
  validateSessionPlanDecision,
} from '@/lib/ai-policy/validators';
import type { FrictionState } from '@/types/friction';

const policyClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

async function callWithTimeout(model: string, prompt: string, timeoutMs: number): Promise<unknown> {
  if (!policyClient) {
    throw new Error('provider_unavailable');
  }

  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    return await policyClient.responses.create(
      {
        model,
        input: [
          {
            role: 'user',
            content: [{ type: 'input_text', text: prompt }],
          },
        ],
        max_output_tokens: 360,
      },
      { signal: abortController.signal }
    );
  } finally {
    clearTimeout(timer);
  }
}

function normalizePolicyError(error: unknown): AIPolicyErrorCode {
  if (error instanceof Error) {
    if (error.message === 'provider_unavailable') return 'provider_unavailable';
    if (error.name === 'AbortError') return 'timeout';
  }
  return 'request_failed';
}

async function runPolicyDecision<T>(params: {
  prompt: string;
  fallbackOutput: T;
  validate: (parsed: Record<string, unknown>) => { output: T; confidence: number } | null;
}): Promise<PolicyDecisionEnvelope<T>> {
  const startedAt = Date.now();
  const deadlineAt = startedAt + AI_POLICY_TIMEOUT_MS;

  if (!policyClient) {
    return {
      output: params.fallbackOutput,
      confidence: 0,
      model: 'deterministic-fallback',
      latencyMs: Date.now() - startedAt,
      fallbackUsed: true,
      errorCode: 'provider_unavailable',
    };
  }

  let errorCode: AIPolicyErrorCode = 'request_failed';

  for (const model of [AI_POLICY_PRIMARY_MODEL, AI_POLICY_FALLBACK_MODEL]) {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 0) {
      errorCode = 'timeout';
      break;
    }

    try {
      const response = await callWithTimeout(model, params.prompt, remainingMs);
      const raw = extractOutputText(response);
      if (!raw) {
        errorCode = 'empty_output';
        continue;
      }

      const parsed = parseJsonOutput(raw);
      if (!parsed) {
        errorCode = 'parse_failed';
        continue;
      }

      const validated = params.validate(parsed);
      if (!validated) {
        errorCode = 'validation_failed';
        continue;
      }

      if (validated.confidence < AI_POLICY_CONFIDENCE_THRESHOLD) {
        errorCode = 'low_confidence';
        continue;
      }

      return {
        output: validated.output,
        confidence: validated.confidence,
        model,
        latencyMs: Date.now() - startedAt,
        fallbackUsed: false,
        errorCode: 'none',
      };
    } catch (error) {
      errorCode = normalizePolicyError(error);
    }
  }

  return {
    output: params.fallbackOutput,
    confidence: 0,
    model: 'deterministic-fallback',
    latencyMs: Date.now() - startedAt,
    fallbackUsed: true,
    errorCode,
  };
}

export async function decideSessionPlanPolicy(params: {
  trackSlug: string;
  trackName: string;
  maxItems: number;
  requirePracticeItem: boolean;
  recentActivityTitles: string[];
  candidates: Array<{
    id: string;
    type: 'learn' | 'practice';
    title: string;
    estMinutes: number;
    targetConcept: string | null;
  }>;
  fallbackOutput: SessionPlanDecisionOutput;
}): Promise<PolicyDecisionEnvelope<SessionPlanDecisionOutput>> {
  const prompt = buildSessionPlanPolicyPrompt({
    trackSlug: params.trackSlug,
    trackName: params.trackName,
    maxItems: params.maxItems,
    requirePracticeItem: params.requirePracticeItem,
    recentActivityTitles: params.recentActivityTitles,
    candidates: params.candidates,
  });

  return runPolicyDecision({
    prompt,
    fallbackOutput: params.fallbackOutput,
    validate: validateSessionPlanDecision,
  });
}

export async function decideScopePolicy(params: {
  trackSlug: string;
  goal: string | null;
  profileSegment: string | null;
  baselineItemCount: number;
  baselineMinutes: number;
  candidateMinutes: number[];
  fallbackOutput: ScopePolicyDecisionOutput;
}): Promise<PolicyDecisionEnvelope<ScopePolicyDecisionOutput>> {
  const prompt = buildScopePolicyPrompt({
    trackSlug: params.trackSlug,
    goal: params.goal,
    profileSegment: params.profileSegment,
    baselineItemCount: params.baselineItemCount,
    baselineMinutes: params.baselineMinutes,
    candidateMinutes: params.candidateMinutes,
  });

  return runPolicyDecision({
    prompt,
    fallbackOutput: params.fallbackOutput,
    validate: validateScopePolicyDecision,
  });
}

export async function decideOnboardingPathPolicy(params: {
  goal: 'interview' | 'work' | 'fundamentals';
  returnTo: string | null;
  sessionStartPath: string;
  allowedPaths: string[];
  fallbackOutput: OnboardingPathDecisionOutput;
}): Promise<PolicyDecisionEnvelope<OnboardingPathDecisionOutput>> {
  const prompt = buildOnboardingPathPolicyPrompt({
    goal: params.goal,
    returnTo: params.returnTo,
    sessionStartPath: params.sessionStartPath,
    allowedPaths: params.allowedPaths,
  });

  return runPolicyDecision({
    prompt,
    fallbackOutput: params.fallbackOutput,
    validate: (parsed) => validateOnboardingPathDecision(parsed, params.allowedPaths, params.fallbackOutput.targetPath),
  });
}

export async function decideFrictionTriagePolicy(params: {
  trackSlug: string;
  stepIndex: number;
  lookbackDays: number;
  sampleSize: number;
  stuckRate: number;
  avgConfidence: number;
  avgElapsedRatio: number;
  ownerCandidates: string[];
  existingStatus: 'new' | 'investigating' | 'resolved';
  existingOwner: string | null;
  dominantState: FrictionState | 'none';
  fallbackOutput: FrictionTriageDecisionOutput;
}): Promise<PolicyDecisionEnvelope<FrictionTriageDecisionOutput>> {
  const prompt = buildFrictionTriagePolicyPrompt({
    trackSlug: params.trackSlug,
    stepIndex: params.stepIndex,
    lookbackDays: params.lookbackDays,
    sampleSize: params.sampleSize,
    stuckRate: params.stuckRate,
    avgConfidence: params.avgConfidence,
    avgElapsedRatio: params.avgElapsedRatio,
    ownerCandidates: params.ownerCandidates,
    existingStatus: params.existingStatus,
    existingOwner: params.existingOwner,
    dominantState: params.dominantState,
  });

  return runPolicyDecision({
    prompt,
    fallbackOutput: params.fallbackOutput,
    validate: (parsed) => validateFrictionTriageDecision(parsed, params.ownerCandidates),
  });
}

export { AI_POLICY_CONFIDENCE_THRESHOLD, AI_POLICY_PRIMARY_MODEL, AI_POLICY_FALLBACK_MODEL };
