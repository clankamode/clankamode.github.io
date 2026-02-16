'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

export type AIDecisionReviewLabel = 'confirmed' | 'overridden' | 'inconclusive';

function normalizeReviewLabel(value: string | null): AIDecisionReviewLabel | null {
  if (value === 'confirmed' || value === 'overridden' || value === 'inconclusive') return value;
  return null;
}

function normalizeNotes(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 500);
}

export async function reviewAIDecisionAction(payload: {
  decisionId: string;
  label: string | null;
  notes?: string | null;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole | undefined) ?? UserRole.USER;
  const reviewerEmail = session?.user?.email?.trim().toLowerCase() ?? null;

  if (!reviewerEmail || !hasRole(role, UserRole.ADMIN)) {
    return { success: false as const, error: 'Unauthorized' };
  }

  if (!payload.decisionId || !/^[a-f0-9-]{36}$/i.test(payload.decisionId)) {
    return { success: false as const, error: 'Invalid decision id' };
  }

  const label = normalizeReviewLabel(payload.label);
  if (!label) {
    return { success: false as const, error: 'Invalid review label' };
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from('SessionAIDecisions')
    .select('output_json')
    .eq('id', payload.decisionId)
    .maybeSingle();

  if (existingError || !existing) {
    return { success: false as const, error: 'Decision not found' };
  }

  const nextOutput = {
    ...((existing.output_json as Record<string, unknown> | null) ?? {}),
    reviewLabel: label,
    reviewNotes: normalizeNotes(payload.notes ?? null),
    reviewedBy: reviewerEmail,
    reviewedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('SessionAIDecisions')
    .update({ output_json: nextOutput })
    .eq('id', payload.decisionId);

  if (error) {
    console.warn('[ai-decision-review] update failed:', error.message);
    return { success: false as const, error: 'Failed to save decision review' };
  }

  revalidatePath('/admin/session-intelligence');
  return { success: true as const };
}
