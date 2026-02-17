'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '../api/auth/[...nextauth]/auth';
import { FeatureFlags, isFeatureEnabled } from '@/lib/flags';
import { decideFrictionTriagePolicy } from '@/lib/ai-policy/runtime';
import { buildAIDecisionDedupeKey, logAIDecision } from '@/lib/ai-decision-registry';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';
import type { FrictionState, FrictionTriagePayload, FrictionTriageStatus } from '@/types/friction';

const MAX_OWNER_LENGTH = 120;
const MAX_NOTES_LENGTH = 2000;
const DEFAULT_LOOKBACK_DAYS = 14;
const MAX_RATIONALE_LENGTH = 500;
const AUTO_TRIAGE_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const TRIAGE_BRIEF_PROMPT_VERSION = 'triage_brief_v1';
const TRIAGE_RECOMMEND_PROMPT_VERSION = 'triage_recommend_v1';

type SnapshotEvidenceRow = {
  created_at: string;
  session_id: string;
  friction_state: FrictionState;
  trigger: string;
  confidence: number | string;
  signals: Record<string, unknown> | null;
};

type TelemetryEvidenceRow = {
  created_at: string;
  session_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
};

type RecommendationResponse = {
  status?: string;
  owner?: string | null;
  rationale?: string;
};

type TriageAuditAction = 'manual_update' | 'ai_brief' | 'ai_recommendation' | 'ai_auto_batch';

type ExistingTriageRow = {
  status: string | null;
  owner: string | null;
  notes: string | null;
  updated_at?: string | null;
};

interface OpenAIResponseContent {
  type?: string;
  text?: string;
}

interface OpenAIResponseItem {
  type?: string;
  content?: OpenAIResponseContent[];
}

interface OpenAIResponse {
  output_text?: string;
  output?: OpenAIResponseItem[];
}

function normalizeText(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function isValidTrackSlug(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
}

function extractOutputText(response: OpenAIResponse): string | null {
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

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function parseRecommendationText(raw: string): RecommendationResponse | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as RecommendationResponse;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as RecommendationResponse;
    } catch {
      return null;
    }
  }
}

function normalizeRecommendedStatus(value: string | undefined, fallback: FrictionTriageStatus): FrictionTriageStatus {
  if (value === 'new' || value === 'investigating' || value === 'resolved') return value;
  return fallback;
}

function normalizeTriageState(row: ExistingTriageRow | null | undefined): {
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

async function writeTriageAuditEntry(params: {
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

export async function upsertFrictionTriageAction(payload: FrictionTriagePayload) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole | undefined) ?? UserRole.USER;
  const email = session?.user?.email?.trim().toLowerCase() ?? null;

  if (!email || !hasRole(role, UserRole.ADMIN)) {
    return { success: false as const, error: 'Unauthorized' };
  }

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
          updated_by_email: email,
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
      actorEmail: email,
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
    const sessionIds = Array.from(new Set(snapshots.map((row) => row.session_id))).slice(0, 60);
    const { data: telemetryData } = await supabase
      .from('TelemetryEvents')
      .select('created_at, session_id, event_type, payload')
      .in('session_id', sessionIds)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(240);

    const telemetry = (telemetryData || []) as TelemetryEvidenceRow[];
    const stuckCount = snapshots.filter((row) => row.friction_state === 'stuck').length;
    const stuckRate = snapshots.length > 0 ? stuckCount / snapshots.length : 0;
    const confidenceAvg = average(snapshots.map((row) => Number(row.confidence) || 0));
    const elapsedRatios = snapshots
      .map((row) => {
        const elapsed = Number(row.signals?.elapsedMs);
        const estimated = Number(row.signals?.estimatedMs);
        if (!Number.isFinite(elapsed) || !Number.isFinite(estimated) || estimated <= 0) return null;
        return elapsed / estimated;
      })
      .filter((value): value is number => value !== null);
    const avgElapsedRatio = average(elapsedRatios);
    const blockedAvg = average(
      snapshots
        .map((row) => Number(row.signals?.practiceBlockedCount))
        .filter((value) => Number.isFinite(value))
    );
    const togglesAvg = average(
      snapshots
        .map((row) => Number(row.signals?.chunkNextCount || 0) + Number(row.signals?.chunkPrevCount || 0))
        .filter((value) => Number.isFinite(value))
    );

    const eventCounts = telemetry.reduce<Record<string, number>>((acc, row) => {
      acc[row.event_type] = (acc[row.event_type] || 0) + 1;
      return acc;
    }, {});
    const topEvents = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([eventType, count]) => ({ eventType, count }));

    const evidence = {
      trackSlug: payload.trackSlug,
      stepIndex: payload.stepIndex,
      lookbackDays,
      sampleSize: snapshots.length,
      uniqueSessions: sessionIds.length,
      stuckRate,
      averageConfidence: confidenceAvg,
      averageElapsedRatio: avgElapsedRatio,
      averagePracticeBlockedCount: blockedAvg,
      averageChunkToggleCount: togglesAvg,
      topEvents,
      latestSnapshots: snapshots.slice(0, 12).map((row) => ({
        createdAt: row.created_at,
        state: row.friction_state,
        trigger: row.trigger,
        confidence: Number(row.confidence),
      })),
    };

    let generatedBrief: string;
    let briefModel = 'deterministic-fallback';

    if (!process.env.OPENAI_API_KEY) {
      generatedBrief = [
        `Observed: ${Math.round(stuckRate * 100)}% stuck over ${snapshots.length} snapshots across ${sessionIds.length} sessions.`,
        `Likely causes: avg elapsed ratio ${avgElapsedRatio.toFixed(2)}x estimate; avg blocked count ${blockedAvg.toFixed(2)}; avg chunk toggles ${togglesAvg.toFixed(2)}.`,
        `Next action: assign owner, inspect 3 newest sessions, and test whether estimate/step framing should be adjusted.`,
      ].join('\n');
    } else {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      briefModel = 'gpt-5-nano';
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

      generatedBrief = extractOutputText(response as OpenAIResponse) || 'Observed: Not enough signal.\nLikely causes: Unknown.\nNext action: Review latest sessions manually.';
    }

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
          updated_by_email: email,
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
      actorEmail: email,
      model: briefModel,
      promptVersion: TRIAGE_BRIEF_PROMPT_VERSION,
      confidence: confidenceAvg,
      rationale: generatedBrief,
      inputJson: evidence,
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

    const snapshots = (snapshotsData || []) as Array<{
      created_at: string;
      session_id: string;
      friction_state: FrictionState;
      confidence: number | string;
      signals: Record<string, unknown> | null;
    }>;

    const ownerCounts = new Map<string, number>();
    for (const row of (trackTriageData || []) as Array<{ owner: string | null; status: string }>) {
      if (!row.owner) continue;
      const key = row.owner.trim().toLowerCase();
      if (!key) continue;
      const weight = row.status === 'resolved' ? 2 : 1;
      ownerCounts.set(key, (ownerCounts.get(key) || 0) + weight);
    }

    const ownerCandidates = Array.from(ownerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([owner]) => owner);

    const stuckCount = snapshots.filter((row) => row.friction_state === 'stuck').length;
    const stuckRate = snapshots.length > 0 ? stuckCount / snapshots.length : 0;
    const confidenceAvg = average(snapshots.map((row) => Number(row.confidence) || 0));
    const elapsedRatios = snapshots
      .map((row) => {
        const elapsed = Number(row.signals?.elapsedMs);
        const estimated = Number(row.signals?.estimatedMs);
        if (!Number.isFinite(elapsed) || !Number.isFinite(estimated) || estimated <= 0) return null;
        return elapsed / estimated;
      })
      .filter((value): value is number => value !== null);
    const elapsedRatioAvg = average(elapsedRatios);

    const existingStatus = (existingRow?.status as FrictionTriageStatus | undefined) ?? 'new';
    const existingOwner = normalizeText((existingRow?.owner as string | null) ?? null, MAX_OWNER_LENGTH);
    const existingUpdatedAt = typeof existingRow?.updated_at === 'string' ? existingRow.updated_at : null;

    if (payload.source === 'ai_auto_batch' && existingUpdatedAt) {
      const sinceLastUpdateMs = Date.now() - new Date(existingUpdatedAt).getTime();
      if (sinceLastUpdateMs < AUTO_TRIAGE_COOLDOWN_MS) {
        return { success: false as const, error: 'Skipped: hotspot updated recently' };
      }
    }

    const fallbackStatus: FrictionTriageStatus =
      stuckRate >= 0.35 || snapshots.length >= 6 ? 'investigating' : existingStatus;
    const fallbackOwner = existingOwner ?? ownerCandidates[0] ?? null;
    let recommendedStatus = fallbackStatus;
    let recommendedOwner = fallbackOwner;
    let rationale =
      `Risk signal ${stuckRate.toFixed(2)} stuck rate over ${snapshots.length} samples; recommended ${fallbackStatus}.`;
    let recommendationModel = 'deterministic-fallback';
    let fallbackUsed = true;
    let latencyMs: number | null = null;
    let errorCode: string | null = null;
    const aiPolicyTriageEnabled = isFeatureEnabled(FeatureFlags.AI_POLICY_TRIAGE, session?.user ?? null);

    if (aiPolicyTriageEnabled) {
      const stateCounts = snapshots.reduce<Record<FrictionState, number>>((acc, row) => {
        acc[row.friction_state] = (acc[row.friction_state] || 0) + 1;
        return acc;
      }, {
        flow: 0,
        stuck: 0,
        drift: 0,
        fatigue: 0,
        coast: 0,
      });
      const dominantState = (Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none') as FrictionState | 'none';
      const policyDecision = await decideFrictionTriagePolicy({
        trackSlug: payload.trackSlug,
        stepIndex: payload.stepIndex,
        lookbackDays,
        sampleSize: snapshots.length,
        stuckRate,
        avgConfidence: confidenceAvg,
        avgElapsedRatio: elapsedRatioAvg,
        ownerCandidates,
        existingStatus,
        existingOwner,
        dominantState,
        fallbackOutput: {
          status: fallbackStatus,
          owner: fallbackOwner,
          rationale,
        },
      });

      recommendedStatus = policyDecision.output.status;
      recommendedOwner = policyDecision.output.owner ?? fallbackOwner;
      rationale = policyDecision.output.rationale;
      recommendationModel = policyDecision.model;
      fallbackUsed = policyDecision.fallbackUsed;
      latencyMs = policyDecision.latencyMs;
      errorCode = policyDecision.errorCode === 'none' ? null : policyDecision.errorCode;
    }

    if (!aiPolicyTriageEnabled && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      recommendationModel = 'gpt-5-nano';
      fallbackUsed = false;
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
                    trackSlug: payload.trackSlug,
                    stepIndex: payload.stepIndex,
                    lookbackDays,
                    sampleSize: snapshots.length,
                    stuckRate,
                    avgConfidence: confidenceAvg,
                    avgElapsedRatio: elapsedRatioAvg,
                  },
                  existing: { status: existingStatus, owner: existingOwner },
                  ownerCandidates,
                }),
              },
            ],
          },
        ],
        max_output_tokens: 220,
      });

      const parsed = parseRecommendationText(extractOutputText(response as OpenAIResponse) || '');
      if (parsed) {
        recommendedStatus = normalizeRecommendedStatus(parsed.status, fallbackStatus);
        const parsedOwner = normalizeText(parsed.owner ?? null, MAX_OWNER_LENGTH)?.toLowerCase() ?? null;
        recommendedOwner =
          parsedOwner && ownerCandidates.includes(parsedOwner)
            ? parsedOwner
            : fallbackOwner;
        if (parsed.rationale?.trim()) {
          rationale = parsed.rationale.trim().slice(0, 240);
        }
      } else {
        fallbackUsed = true;
        errorCode = 'parse_failed';
      }
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
          updated_by_email: email,
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

    await logAIDecision({
      decisionType: 'triage_recommendation',
      decisionMode: payload.source === 'ai_auto_batch' ? 'auto' : 'assist',
      trackSlug: payload.trackSlug,
      stepIndex: payload.stepIndex,
      actorEmail: email,
      model: recommendationModel,
      promptVersion: TRIAGE_RECOMMEND_PROMPT_VERSION,
      confidence: confidenceAvg,
      rationale,
      inputJson: {
        lookbackDays,
        sampleSize: snapshots.length,
        stuckRate,
        avgConfidence: confidenceAvg,
        avgElapsedRatio: elapsedRatioAvg,
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
      source: payload.source ?? 'ai_recommendation',
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
        source: payload.source ?? 'ai_recommendation',
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
        source: payload.source ?? 'ai_recommendation',
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
