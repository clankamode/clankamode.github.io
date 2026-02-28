import type { FrictionState, FrictionTriageStatus } from '@/types/friction';
import type { PersonalizationSnapshot } from '@/lib/session-personalization';
import type { ScopeCohort, TelemetryRow } from './types';

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function percentile95(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index] ?? null;
}

export function buildUserKey(email: string, googleId: string | null): string {
  return googleId ? `${email} (${googleId.slice(0, 8)}...)` : email;
}

export function stateBadgeClass(state: FrictionState): string {
  if (state === 'stuck') return 'text-red-300';
  if (state === 'fatigue') return 'text-amber-300';
  if (state === 'drift') return 'text-yellow-300';
  if (state === 'coast') return 'text-blue-300';
  return 'text-emerald-300';
}

export function triageBadgeClass(status: FrictionTriageStatus): string {
  if (status === 'resolved') return 'text-emerald-300';
  if (status === 'investigating') return 'text-amber-300';
  return 'text-red-300';
}

export function transferStatusClass(status: 'promote' | 'hold' | 'rollback'): string {
  if (status === 'promote') return 'text-emerald-300';
  if (status === 'rollback') return 'text-red-300';
  return 'text-amber-300';
}

export function triageKey(trackSlug: string, stepIndex: number): string {
  return `${trackSlug}:${stepIndex}`;
}

export function parsePersonalizationSnapshot(row: TelemetryRow): PersonalizationSnapshot | null {
  const payload = row.payload;
  if (!payload) return null;

  const scoreRaw = payload.score;
  const segmentRaw = payload.segment;
  const recommendationRaw = payload.recommendation;
  const signalsRaw = payload.signals;

  if (typeof scoreRaw !== 'number' || scoreRaw < 0 || scoreRaw > 1) return null;
  if (
    segmentRaw !== 'momentum'
    && segmentRaw !== 'steady'
    && segmentRaw !== 'fragile'
    && segmentRaw !== 'at_risk'
  ) {
    return null;
  }
  if (
    recommendationRaw !== 'maintain_momentum'
    && recommendationRaw !== 'reduce_scope'
    && recommendationRaw !== 'realign_track'
    && recommendationRaw !== 'reinforce_ritual'
    && recommendationRaw !== 'stabilize_execution'
  ) {
    return null;
  }
  if (!signalsRaw || typeof signalsRaw !== 'object') return null;

  const trackAlignment = Number((signalsRaw as Record<string, unknown>).trackAlignment);
  const continuation = Number((signalsRaw as Record<string, unknown>).continuation);
  const ritual = Number((signalsRaw as Record<string, unknown>).ritual);
  const focusStability = Number((signalsRaw as Record<string, unknown>).focusStability);
  if (![trackAlignment, continuation, ritual, focusStability].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) {
    return null;
  }

  return {
    createdAt: row.created_at,
    sessionId: row.session_id,
    trackSlug: row.track_slug,
    score: scoreRaw,
    segment: segmentRaw,
    recommendation: recommendationRaw,
    trackAlignment,
    continuation,
    ritual,
    focusStability,
  };
}

export function parseScopeCohort(payload: Record<string, unknown> | null | undefined): ScopeCohort {
  if (!payload) return 'unknown';
  const value = payload.personalizationScopeCohort;
  if (value === 'control' || value === 'treatment' || value === 'not_eligible') {
    return value;
  }
  const nested = payload.scopeExperiment;
  if (nested && typeof nested === 'object') {
    const nestedCohort = (nested as Record<string, unknown>).cohort;
    if (nestedCohort === 'control' || nestedCohort === 'treatment' || nestedCohort === 'not_eligible') {
      return nestedCohort;
    }
  }
  return 'unknown';
}

export function parseScopeEligible(payload: Record<string, unknown> | null | undefined): boolean {
  if (!payload) return false;
  if (typeof payload.personalizationScopeEligible === 'boolean') {
    return payload.personalizationScopeEligible;
  }
  const nested = payload.scopeExperiment;
  if (nested && typeof nested === 'object') {
    const eligible = (nested as Record<string, unknown>).eligible;
    if (typeof eligible === 'boolean') {
      return eligible;
    }
  }
  return false;
}
