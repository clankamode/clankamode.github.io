import type { FrictionState, FrictionTriageStatus } from '@/types/friction';
import type { OwnerCandidateRow, SnapshotEvidenceRow } from './types';

export function deriveOwnerCandidates(rows: OwnerCandidateRow[]): string[] {
  const ownerCounts = new Map<string, number>();
  for (const row of rows) {
    if (!row.owner) continue;
    const key = row.owner.trim().toLowerCase();
    if (!key) continue;
    const weight = row.status === 'resolved' ? 2 : 1;
    ownerCounts.set(key, (ownerCounts.get(key) || 0) + weight);
  }
  return Array.from(ownerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([owner]) => owner);
}

export function deriveDominantState(rows: SnapshotEvidenceRow[]): FrictionState | 'none' {
  const stateCounts = rows.reduce<Record<FrictionState, number>>((acc, row) => {
    acc[row.friction_state] = (acc[row.friction_state] || 0) + 1;
    return acc;
  }, {
    flow: 0,
    stuck: 0,
    drift: 0,
    fatigue: 0,
    coast: 0,
  });
  return (Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none') as FrictionState | 'none';
}

export function buildRecommendationFallback(input: {
  snapshotsLength: number;
  stuckRate: number;
  existingStatus: FrictionTriageStatus;
  existingOwner: string | null;
  ownerCandidates: string[];
}) {
  const fallbackStatus: FrictionTriageStatus =
    input.stuckRate >= 0.35 || input.snapshotsLength >= 6 ? 'investigating' : input.existingStatus;
  const fallbackOwner = input.existingOwner ?? input.ownerCandidates[0] ?? null;

  return {
    status: fallbackStatus,
    owner: fallbackOwner,
    rationale: `Risk signal ${input.stuckRate.toFixed(2)} stuck rate over ${input.snapshotsLength} samples; recommended ${fallbackStatus}.`,
  };
}
