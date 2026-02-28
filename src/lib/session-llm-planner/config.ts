import OpenAI from 'openai';

export const plannerClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const EXPLOITATION_RATIO = 0.7;
export const PLANNER_DEBUG_LOGS = process.env.OPENAI_SESSION_PLANNER_DEBUG === 'true';

export function resolvePlannerModels(): string[] {
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

export function resolveRankerModel(value: string | undefined): string {
  return value?.trim() || 'gpt-5-nano';
}

export function resolvePlannerDailyCallBudget(value: string | undefined): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(1, Math.min(200, Math.floor(parsed)));
  }
  return 10;
}

export function resolveReasoningEffort(value: string | undefined): 'minimal' | 'low' | 'medium' | 'high' {
  if (value === 'minimal' || value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  return 'minimal';
}

export function resolvePlannerAttempts(value: string | undefined): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(1, Math.min(3, Math.floor(parsed)));
  }
  return 1;
}

export function resolvePlannerMaxOutputTokens(value: string | undefined): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(200, Math.min(900, Math.floor(parsed)));
  }
  return 320;
}

export const MAX_PLANNER_ATTEMPTS = resolvePlannerAttempts(process.env.OPENAI_SESSION_PLANNER_MAX_ATTEMPTS);
export const PLANNER_MAX_OUTPUT_TOKENS = resolvePlannerMaxOutputTokens(process.env.OPENAI_SESSION_PLANNER_MAX_OUTPUT_TOKENS);
export const PLANNER_MODEL_FALLBACKS = resolvePlannerModels();
export const PLANNER_RANKER_MODEL = resolveRankerModel(process.env.OPENAI_SESSION_PLANNER_RANKER_MODEL);
export const PLANNER_DAILY_CALL_BUDGET = resolvePlannerDailyCallBudget(process.env.OPENAI_SESSION_PLANNER_DAILY_CALL_BUDGET);
export const PLANNER_REASONING_EFFORT = resolveReasoningEffort(process.env.OPENAI_SESSION_PLANNER_REASONING_EFFORT);
