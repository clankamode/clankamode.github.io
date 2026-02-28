import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { MAX_NOTES_LENGTH, MAX_OWNER_LENGTH, MAX_RATIONALE_LENGTH } from './constants';
import type { ExistingTriageRow, OpenAIResponse, TriageAuditAction } from './types';
import type { FrictionTriageStatus } from '@/types/friction';

export function normalizeText(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function isValidTrackSlug(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
}

export function extractOutputText(response: OpenAIResponse): string | null {
  if (response.output_text?.trim()) return response.output_text.trim();
  const output = response.output ?? [];
  for (const item of output) {
    if (!item.content) continue;
    const text = item.content
      .map((part) => part.text || '')
      .join(' ')
      .trim();
    if (text) return text;
  }
  return null;
}

export function parseRecommendationText(raw: string): { status?: string; owner?: string | null; rationale?: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as { status?: string; owner?: string | null; rationale?: string };
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as { status?: string; owner?: string | null; rationale?: string };
    } catch {
      return null;
    }
  }
}

export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

export function normalizeRecommendedStatus(
  value: string | undefined,
  fallback: FrictionTriageStatus
): FrictionTriageStatus {
  if (value === 'new' || value === 'investigating' || value === 'resolved') return value;
  return fallback;
}

export function normalizeTriageState(row: ExistingTriageRow | null | undefined): {
  status: FrictionTriageStatus;
  owner: string | null;
  notes: string | null;
} {
  return {
    status: normalizeRecommendedStatus(row?.status ?? undefined, 'new'),
    owner: normalizeText(row?.owner ?? null, MAX_OWNER_LENGTH),
    notes: normalizeText(row?.notes ?? null, MAX_NOTES_LENGTH),
  };
}

export async function writeTriageAuditEntry(params: {
  actionType: TriageAuditAction;
  actorEmail: string;
  trackSlug: string;
  stepIndex: number;
  before: { status: FrictionTriageStatus; owner: string | null; notes: string | null };
  after: { status: FrictionTriageStatus; owner: string | null; notes: string | null };
  rationale?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('SessionFrictionTriageAudit')
      .insert({
        action_type: params.actionType,
        actor_email: params.actorEmail,
        track_slug: params.trackSlug,
        step_index: params.stepIndex,
        before_status: params.before.status,
        before_owner: params.before.owner,
        before_notes: params.before.notes,
        after_status: params.after.status,
        after_owner: params.after.owner,
        after_notes: params.after.notes,
        rationale: normalizeText(params.rationale ?? null, MAX_RATIONALE_LENGTH),
        metadata: params.metadata ?? {},
      });

    if (error) {
      console.warn('[friction-triage] audit insert failed:', error.message);
    }
  } catch (error) {
    console.warn('[friction-triage] audit crash:', error);
  }
}
