import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export type AIDecisionType = 'triage_brief' | 'triage_recommendation';
export type AIDecisionMode = 'suggest' | 'assist' | 'auto';

function normalizeKeySegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '_').slice(0, 80);
}

export function buildAIDecisionDedupeKey(params: {
  decisionType: AIDecisionType;
  decisionMode: AIDecisionMode;
  trackSlug: string;
  stepIndex: number;
  source?: string;
  status?: string | null;
  owner?: string | null;
  windowStartIso?: string;
}) {
  const source = normalizeKeySegment(params.source ?? 'session_intelligence');
  const status = normalizeKeySegment(params.status ?? 'na');
  const owner = normalizeKeySegment(params.owner ?? 'na');
  const windowStart = normalizeKeySegment((params.windowStartIso ?? new Date().toISOString()).slice(0, 13));
  return [
    'ai',
    normalizeKeySegment(params.decisionType),
    normalizeKeySegment(params.decisionMode),
    normalizeKeySegment(params.trackSlug),
    String(params.stepIndex),
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
  stepIndex: number;
  actorEmail: string;
  model: string;
  promptVersion: string;
  confidence?: number | null;
  rationale?: string | null;
  inputJson?: Record<string, unknown>;
  outputJson?: Record<string, unknown>;
  applied?: boolean;
  source?: string;
  dedupeKey?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('SessionAIDecisions')
    .insert({
      decision_type: params.decisionType,
      decision_mode: params.decisionMode,
      track_slug: params.trackSlug,
      step_index: params.stepIndex,
      actor_email: params.actorEmail,
      model: params.model,
      prompt_version: params.promptVersion,
      confidence: params.confidence ?? null,
      rationale: params.rationale ?? null,
      input_json: params.inputJson ?? {},
      output_json: params.outputJson ?? {},
      applied: params.applied ?? true,
      source: params.source ?? 'session_intelligence',
      dedupe_key: params.dedupeKey ?? null,
    });

  if (error) {
    if (error.code === '23505' || /duplicate/i.test(error.message)) {
      return;
    }
    console.warn('[ai-decision] insert failed:', error.message);
  }
}
