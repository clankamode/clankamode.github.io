import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export type AIDecisionType =
  | 'triage_brief'
  | 'triage_recommendation'
  | 'session_plan'
  | 'scope_policy'
  | 'onboarding_path';
export type AIDecisionMode = 'suggest' | 'assist' | 'auto';
export type AIDecisionScope = 'planner' | 'scope' | 'onboarding' | 'triage';

function normalizeKeySegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '_').slice(0, 80);
}

export function buildAIDecisionDedupeKey(params: {
  decisionType: AIDecisionType;
  decisionMode: AIDecisionMode;
  trackSlug?: string;
  stepIndex?: number | null;
  decisionScope?: AIDecisionScope;
  sessionId?: string | null;
  decisionTarget?: string | null;
  source?: string;
  status?: string | null;
  owner?: string | null;
  windowStartIso?: string;
}) {
  const trackSlug = normalizeKeySegment(params.trackSlug ?? 'na');
  const stepIndex = typeof params.stepIndex === 'number' ? String(params.stepIndex) : 'na';
  const decisionScope = normalizeKeySegment(params.decisionScope ?? 'na');
  const sessionId = normalizeKeySegment(params.sessionId ?? 'na');
  const decisionTarget = normalizeKeySegment(params.decisionTarget ?? 'na');
  const source = normalizeKeySegment(params.source ?? 'session_intelligence');
  const status = normalizeKeySegment(params.status ?? 'na');
  const owner = normalizeKeySegment(params.owner ?? 'na');
  const windowStart = normalizeKeySegment((params.windowStartIso ?? new Date().toISOString()).slice(0, 13));

  return [
    'ai',
    normalizeKeySegment(params.decisionType),
    normalizeKeySegment(params.decisionMode),
    decisionScope,
    trackSlug,
    stepIndex,
    sessionId,
    decisionTarget,
    source,
    status,
    owner,
    windowStart,
  ].join(':');
}

export async function logAIDecision(params: {
  decisionType: AIDecisionType;
  decisionMode: AIDecisionMode;
  trackSlug: string;
  stepIndex?: number | null;
  actorEmail: string;
  model: string;
  promptVersion: string;
  confidence?: number | null;
  rationale?: string | null;
  inputJson?: Record<string, unknown>;
  outputJson?: Record<string, unknown>;
  applied?: boolean;
  source?: string;
  sessionId?: string | null;
  decisionScope?: AIDecisionScope | null;
  decisionTarget?: string | null;
  fallbackUsed?: boolean;
  latencyMs?: number | null;
  errorCode?: string | null;
  dedupeKey?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('SessionAIDecisions')
    .insert({
      decision_type: params.decisionType,
      decision_mode: params.decisionMode,
      track_slug: params.trackSlug,
      step_index: params.stepIndex ?? null,
      actor_email: params.actorEmail,
      model: params.model,
      prompt_version: params.promptVersion,
      confidence: params.confidence ?? null,
      rationale: params.rationale ?? null,
      input_json: params.inputJson ?? {},
      output_json: params.outputJson ?? {},
      applied: params.applied ?? true,
      source: params.source ?? 'session_intelligence',
      session_id: params.sessionId ?? null,
      decision_scope: params.decisionScope ?? null,
      decision_target: params.decisionTarget ?? null,
      fallback_used: params.fallbackUsed ?? false,
      latency_ms: params.latencyMs ?? null,
      error_code: params.errorCode ?? null,
      dedupe_key: params.dedupeKey ?? null,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    if (error.code === '23505' || /duplicate/i.test(error.message)) {
      return { id: null, duplicate: true };
    }
    console.warn('[ai-decision] insert failed:', error.message);
    return { id: null, duplicate: false };
  }

  return { id: data?.id ?? null, duplicate: false };
}
