'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/auth';
import { FeatureFlags, isFeatureEnabled } from '@/lib/flags';
import { buildAIDecisionDedupeKey, logAIDecision } from '@/lib/ai-decision-registry';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';
import type { FrictionTriagePayload, FrictionTriageStatus } from '@/types/friction';

import {
  AUTO_TRIAGE_COOLDOWN_MS,
  DEFAULT_LOOKBACK_DAYS,
  MAX_NOTES_LENGTH,
  MAX_OWNER_LENGTH,
  TRIAGE_BRIEF_PROMPT_VERSION,
  TRIAGE_RECOMMEND_PROMPT_VERSION,
} from './constants';
import { generateOpenAIRecommendation, generateTriageBrief, runPolicyTriageDecision } from './prompts';
import { buildRecommendationFallback, deriveDominantState, deriveOwnerCandidates } from './heuristics';
import { buildBriefEvidence, calculateAverageConfidence, calculateAverageElapsedRatio, calculateStuckRate, getUniqueSessionIds } from './scoring';
import { isValidTrackSlug, normalizeText, normalizeTriageState, writeTriageAuditEntry } from './utils';
import type { ExistingTriageRow, SnapshotEvidenceRow, TelemetryEvidenceRow } from './types';

export async function upsertFrictionTriageAction(payload: FrictionTriagePayload) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole | undefined) ?? UserRole.USER;
  const email = session?.user?.email?.trim().toLowerCase() ?? null;

  if (!email || !hasRole(role, UserRole.ADMIN)) {
    return { success: false as const, error: 'Unauthorized' };
  }
  const actorEmail = email as string;

  if (!isValidTrackSlug(payload.trackSlug)) {
    return { success: false as const, error: 'Invalid track slug' };
  }

  if (!Number.isInteger(payload.stepIndex) || payload.stepIndex < 0 || payload.stepIndex > 999) {
    return { success: false as const, error: 'Invalid step index' };
  }

  const owner = normalizeText(payload.owner, MAX_OWNER_LENGTH);
  const notes = normalizeText(payload.notes, MAX_NOTES_LENGTH);

  try {
    const supabase = getSupabaseAdminClient();
    const { data: existingRow } = await supabase
      .from('SessionFrictionTriage')
      .select('status, owner, notes')
      .eq('track_slug', payload.trackSlug)
      .eq('step_index', payload.stepIndex)
      .maybeSingle();

    const before = normalizeTriageState((existingRow ?? null) as ExistingTriageRow | null);
    const after = {
      status: payload.status,
      owner,
      notes,
    };

    const { error } = await supabase
      .from('SessionFrictionTriage')
      .upsert(
        {
          track_slug: payload.trackSlug,
          step_index: payload.stepIndex,
          status: payload.status,
          owner,
          notes,
          updated_by_email: actorEmail,
        },
        {
          onConflict: 'track_slug,step_index',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.warn('[friction-triage] upsert failed:', error.message);
      return { success: false as const, error: 'Failed to save triage' };
    }

    await writeTriageAuditEntry({
      actionType: 'manual_update',
      actorEmail,
      trackSlug: payload.trackSlug,
      stepIndex: payload.stepIndex,
      before,
      after,
      rationale: 'Manual triage update from admin dashboard.',
      metadata: { source: 'manual_form' },
    });

    revalidatePath('/admin/session-intelligence');
    return { success: true as const };
  } catch (error) {
    console.warn('[friction-triage] action crash:', error);
    return { success: false as const, error: 'Failed to save triage' };
  }
}

export async function generateFrictionTriageBriefAction(payload: {
  trackSlug: string;
  stepIndex: number;
  lookbackDays?: number;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole | undefined) ?? UserRole.USER;
  const email = session?.user?.email?.trim().toLowerCase() ?? null;

  if (!email || !hasRole(role, UserRole.ADMIN)) {
    return { success: false as const, error: 'Unauthorized' };
  }
  const actorEmail = email as string;

  if (!isValidTrackSlug(payload.trackSlug)) {
    return { success: false as const, error: 'Invalid track slug' };
  }

  if (!Number.isInteger(payload.stepIndex) || payload.stepIndex < 0 || payload.stepIndex > 999) {
    return { success: false as const, error: 'Invalid step index' };
  }

  const lookbackDays = Number.isInteger(payload.lookbackDays) && payload.lookbackDays && payload.lookbackDays > 0
    ? payload.lookbackDays
    : DEFAULT_LOOKBACK_DAYS;
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { data: snapshotsData, error: snapshotsError } = await supabase
      .from('SessionFrictionSnapshots')
      .select('created_at, session_id, friction_state, trigger, confidence, signals')
      .eq('track_slug', payload.trackSlug)
      .eq('step_index', payload.stepIndex)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(80);

    if (snapshotsError || !snapshotsData || snapshotsData.length === 0) {
      return { success: false as const, error: 'No hotspot evidence available' };
    }

    const snapshots = snapshotsData as SnapshotEvidenceRow[];
    const sessionIds = getUniqueSessionIds(snapshots);
    const { data: telemetryData } = await supabase
      .from('TelemetryEvents')
      .select('created_at, session_id, event_type, payload')
      .in('session_id', sessionIds)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(240);

    const telemetry = (telemetryData || []) as TelemetryEvidenceRow[];
    const evidence = buildBriefEvidence({
      trackSlug: payload.trackSlug,
      stepIndex: payload.stepIndex,
      lookbackDays,
      snapshots,
      telemetry,
      sessionIds,
    });

    const { generatedBrief, model: briefModel } = await generateTriageBrief(evidence);

    const { data: existingRow } = await supabase
      .from('SessionFrictionTriage')
      .select('status, owner, notes')
      .eq('track_slug', payload.trackSlug)
      .eq('step_index', payload.stepIndex)
      .maybeSingle();

    const stampedBrief = `AI Brief (${new Date().toISOString()}):\n${generatedBrief.trim()}`;
    const existingNotes = normalizeText((existingRow?.notes as string | null) ?? null, MAX_NOTES_LENGTH);
    const mergedNotes = normalizeText(
      existingNotes ? `${stampedBrief}\n\n${existingNotes}` : stampedBrief,
      MAX_NOTES_LENGTH
    );

    const before = normalizeTriageState((existingRow ?? null) as ExistingTriageRow | null);
    const after = {
      status: (existingRow?.status as FrictionTriageStatus | undefined) ?? 'investigating',
      owner: normalizeText((existingRow?.owner as string | null) ?? null, MAX_OWNER_LENGTH),
      notes: mergedNotes,
    };

    const { error: upsertError } = await supabase
      .from('SessionFrictionTriage')
      .upsert(
        {
          track_slug: payload.trackSlug,
          step_index: payload.stepIndex,
          status: after.status,
          owner: after.owner,
          notes: mergedNotes,
          updated_by_email: actorEmail,
        },
        {
          onConflict: 'track_slug,step_index',
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.warn('[friction-triage] ai brief upsert failed:', upsertError.message);
      return { success: false as const, error: 'Failed to save AI brief' };
    }

    await logAIDecision({
      decisionType: 'triage_brief',
      decisionMode: 'assist',
      trackSlug: payload.trackSlug,
      stepIndex: payload.stepIndex,
      actorEmail,
      model: briefModel,
      promptVersion: TRIAGE_BRIEF_PROMPT_VERSION,
      confidence: evidence.averageConfidence,
      rationale: generatedBrief,
      inputJson: evidence as unknown as Record<string, unknown>,
      outputJson: { brief: generatedBrief, appliedStatus: after.status, appliedOwner: after.owner },
      applied: true,
      source: 'session_intelligence',
      sessionId: snapshots[0]?.session_id ?? null,
      decisionScope: 'triage',
      decisionTarget: `${payload.trackSlug}:${payload.stepIndex}`,
      dedupeKey: buildAIDecisionDedupeKey({
        decisionType: 'triage_brief',
        decisionMode: 'assist',
        decisionScope: 'triage',
        trackSlug: payload.trackSlug,
        stepIndex: payload.stepIndex,
        sessionId: snapshots[0]?.session_id ?? null,
        decisionTarget: `${payload.trackSlug}:${payload.stepIndex}`,
        source: 'session_intelligence',
        status: after.status,
        owner: after.owner,
      }),
    });

    await writeTriageAuditEntry({
      actionType: 'ai_brief',
      actorEmail: email,
      trackSlug: payload.trackSlug,
      stepIndex: payload.stepIndex,
      before,
      after,
      rationale: generatedBrief,
      metadata: {
        source: 'ai_brief',
        lookbackDays,
        sampleSize: snapshots.length,
      },
    });

    revalidatePath('/admin/session-intelligence');
    return { success: true as const };
  } catch (error) {
    console.warn('[friction-triage] ai brief crash:', error);
    return { success: false as const, error: 'Failed to generate AI brief' };
  }
}

export async function recommendAndApplyFrictionTriageAction(payload: {
  trackSlug: string;
  stepIndex: number;
  lookbackDays?: number;
  source?: 'ai_recommendation' | 'ai_auto_batch';
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole | undefined) ?? UserRole.USER;
  const email = session?.user?.email?.trim().toLowerCase() ?? null;

  if (!email || !hasRole(role, UserRole.ADMIN)) {
    return { success: false as const, error: 'Unauthorized' };
  }
  const actorEmail = email as string;

  if (payload.source === 'ai_auto_batch' && !isFeatureEnabled(FeatureFlags.AI_TRIAGE_AUTOMATION, session?.user ?? null)) {
    return { success: false as const, error: 'AI auto-triage is disabled' };
  }

  if (!isValidTrackSlug(payload.trackSlug)) {
    return { success: false as const, error: 'Invalid track slug' };
  }

  if (!Number.isInteger(payload.stepIndex) || payload.stepIndex < 0 || payload.stepIndex > 999) {
    return { success: false as const, error: 'Invalid step index' };
  }

  const lookbackDays = Number.isInteger(payload.lookbackDays) && payload.lookbackDays && payload.lookbackDays > 0
    ? payload.lookbackDays
    : DEFAULT_LOOKBACK_DAYS;
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const [{ data: existingRow }, { data: snapshotsData }, { data: trackTriageData }] = await Promise.all([
      supabase
        .from('SessionFrictionTriage')
        .select('status, owner, notes, updated_at')
        .eq('track_slug', payload.trackSlug)
        .eq('step_index', payload.stepIndex)
        .maybeSingle(),
      supabase
        .from('SessionFrictionSnapshots')
        .select('created_at, session_id, friction_state, confidence, signals')
        .eq('track_slug', payload.trackSlug)
        .eq('step_index', payload.stepIndex)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(80),
      supabase
        .from('SessionFrictionTriage')
        .select('owner, status, updated_at')
        .eq('track_slug', payload.trackSlug)
        .order('updated_at', { ascending: false })
        .limit(200),
    ]);

    const snapshots = (snapshotsData || []) as SnapshotEvidenceRow[];
    const ownerCandidates = deriveOwnerCandidates(
      (trackTriageData || []) as Array<{ owner: string | null; status: string }>
    );

    const stuckRate = calculateStuckRate(snapshots);
    const confidenceAvg = calculateAverageConfidence(snapshots);
    const avgElapsedRatio = calculateAverageElapsedRatio(snapshots);
    const existingStatus = (existingRow?.status as FrictionTriageStatus | undefined) ?? 'new';
    const existingOwner = normalizeText((existingRow?.owner as string | null) ?? null, MAX_OWNER_LENGTH);
    const existingUpdatedAt = typeof existingRow?.updated_at === 'string' ? existingRow.updated_at : null;

    if (payload.source === 'ai_auto_batch' && existingUpdatedAt) {
      const sinceLastUpdateMs = Date.now() - new Date(existingUpdatedAt).getTime();
      if (sinceLastUpdateMs < AUTO_TRIAGE_COOLDOWN_MS) {
        return { success: false as const, error: 'Skipped: hotspot updated recently' };
      }
    }

    const fallback = buildRecommendationFallback({
      snapshotsLength: snapshots.length,
      stuckRate,
      existingStatus,
      existingOwner,
      ownerCandidates,
    });

    let recommendedStatus = fallback.status;
    let recommendedOwner: string | null = fallback.owner;
    let rationale = fallback.rationale;
    let recommendationModel = 'deterministic-fallback';
    let fallbackUsed = true;
    let latencyMs: number | null = null;
    let errorCode: string | null = null;

    const aiPolicyTriageEnabled = isFeatureEnabled(FeatureFlags.AI_POLICY_TRIAGE, session?.user ?? null);

    if (aiPolicyTriageEnabled) {
      const dominantState = deriveDominantState(snapshots);
      const policyDecision = await runPolicyTriageDecision({
        trackSlug: payload.trackSlug,
        stepIndex: payload.stepIndex,
        lookbackDays,
        sampleSize: snapshots.length,
        stuckRate,
        avgConfidence: confidenceAvg,
        avgElapsedRatio,
        ownerCandidates,
        existingStatus,
        existingOwner,
        dominantState,
        fallbackStatus: fallback.status,
        fallbackOwner: fallback.owner,
        fallbackRationale: fallback.rationale,
      });

      recommendedStatus = policyDecision.status;
      recommendedOwner = policyDecision.owner ?? null;
      rationale = policyDecision.rationale;
      recommendationModel = policyDecision.model;
      fallbackUsed = policyDecision.fallbackUsed;
      latencyMs = policyDecision.latencyMs;
      errorCode = policyDecision.errorCode;
    }

    if (!aiPolicyTriageEnabled && process.env.OPENAI_API_KEY) {
      const recommendation = await generateOpenAIRecommendation({
        trackSlug: payload.trackSlug,
        stepIndex: payload.stepIndex,
        lookbackDays,
        sampleSize: snapshots.length,
        stuckRate,
        avgConfidence: confidenceAvg,
        avgElapsedRatio,
        existingStatus,
        existingOwner,
        ownerCandidates,
        fallbackStatus: fallback.status,
        fallbackOwner: fallback.owner,
        fallbackRationale: fallback.rationale,
      });

      recommendedStatus = recommendation.status;
      recommendedOwner = recommendation.owner ?? null;
      if (recommendation.rationale) {
        rationale = recommendation.rationale;
      }
      recommendationModel = recommendation.model;
      fallbackUsed = recommendation.fallbackUsed;
      errorCode = recommendation.errorCode;
    }

    const existingNotes = normalizeText((existingRow?.notes as string | null) ?? null, MAX_NOTES_LENGTH);
    const stampedNote = `AI Recommendation (${new Date().toISOString()}): status=${recommendedStatus}; owner=${recommendedOwner || 'unassigned'}; rationale=${rationale}`;
    const mergedNotes = normalizeText(
      existingNotes ? `${stampedNote}\n\n${existingNotes}` : stampedNote,
      MAX_NOTES_LENGTH
    );
    const before = normalizeTriageState((existingRow ?? null) as ExistingTriageRow | null);
    const after = {
      status: recommendedStatus,
      owner: recommendedOwner,
      notes: mergedNotes,
    };

    const { error } = await supabase
      .from('SessionFrictionTriage')
      .upsert(
        {
          track_slug: payload.trackSlug,
          step_index: payload.stepIndex,
          status: recommendedStatus,
          owner: recommendedOwner,
          notes: mergedNotes,
          updated_by_email: actorEmail,
        },
        {
          onConflict: 'track_slug,step_index',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.warn('[friction-triage] ai recommendation upsert failed:', error.message);
      return { success: false as const, error: 'Failed to apply recommendation' };
    }

    const decisionSource = payload.source ?? 'ai_recommendation';

    await logAIDecision({
      decisionType: 'triage_recommendation',
      decisionMode: payload.source === 'ai_auto_batch' ? 'auto' : 'assist',
      trackSlug: payload.trackSlug,
      stepIndex: payload.stepIndex,
      actorEmail,
      model: recommendationModel,
      promptVersion: TRIAGE_RECOMMEND_PROMPT_VERSION,
      confidence: confidenceAvg,
      rationale,
      inputJson: {
        lookbackDays,
        sampleSize: snapshots.length,
        stuckRate,
        avgConfidence: confidenceAvg,
        avgElapsedRatio,
        existingStatus,
        existingOwner,
        ownerCandidates,
      },
      outputJson: {
        recommendedStatus,
        recommendedOwner,
        appliedStatus: after.status,
        appliedOwner: after.owner,
      },
      applied: true,
      source: decisionSource,
      sessionId: snapshots[0]?.session_id ?? null,
      decisionScope: 'triage',
      decisionTarget: `${payload.trackSlug}:${payload.stepIndex}`,
      fallbackUsed,
      latencyMs,
      errorCode,
      dedupeKey: buildAIDecisionDedupeKey({
        decisionType: 'triage_recommendation',
        decisionMode: payload.source === 'ai_auto_batch' ? 'auto' : 'assist',
        decisionScope: 'triage',
        trackSlug: payload.trackSlug,
        stepIndex: payload.stepIndex,
        sessionId: snapshots[0]?.session_id ?? null,
        decisionTarget: `${payload.trackSlug}:${payload.stepIndex}`,
        source: decisionSource,
        status: after.status,
        owner: after.owner,
      }),
    });

    await writeTriageAuditEntry({
      actionType: payload.source === 'ai_auto_batch' ? 'ai_auto_batch' : 'ai_recommendation',
      actorEmail: email,
      trackSlug: payload.trackSlug,
      stepIndex: payload.stepIndex,
      before,
      after,
      rationale,
      metadata: {
        source: decisionSource,
        lookbackDays,
        sampleSize: snapshots.length,
        ownerCandidates,
      },
    });

    revalidatePath('/admin/session-intelligence');
    return { success: true as const };
  } catch (error) {
    console.warn('[friction-triage] ai recommendation crash:', error);
    return { success: false as const, error: 'Failed to apply recommendation' };
  }
}
