import type { FrictionMonitorMetrics } from '@/lib/friction-monitor';
import { AUTO_TRIAGE_MINUTES_COOLDOWN } from './params';
import { triageKey } from './utils';
import type {
  FetchedFrictionTriageRow,
  FrictionTriageStatus,
  QueueOwnerKey,
  QueueStatusKey,
  TelemetryRow,
  FrictionSnapshotInput,
} from './types';

export function buildGoalBreakdown(
  firstWinGoalRows: TelemetryRow[],
  onboardingGoalCount: number,
): { goal: string; sessions: number; share: number }[] {
  return Array.from(
    firstWinGoalRows.reduce((acc, row) => {
      const goal = typeof row.payload?.goal === 'string' ? row.payload.goal : 'unknown';
      const set = acc.get(goal) ?? new Set<string>();
      set.add(row.session_id);
      acc.set(goal, set);
      return acc;
    }, new Map<string, Set<string>>()),
  ).map(([goal, sessions]) => ({
    goal,
    sessions: sessions.size,
    share: onboardingGoalCount > 0 ? sessions.size / onboardingGoalCount : 0,
  })).sort((a, b) => b.sessions - a.sessions);
}

export function buildLaunchPathBreakdown(
  firstWinLaunchRows: TelemetryRow[],
  onboardingLaunchCount: number,
): { targetPath: string; sessions: number; share: number }[] {
  return Array.from(
    firstWinLaunchRows.reduce((acc, row) => {
      const targetPath = typeof row.payload?.targetPath === 'string' ? row.payload.targetPath : 'unknown';
      const set = acc.get(targetPath) ?? new Set<string>();
      set.add(row.session_id);
      acc.set(targetPath, set);
      return acc;
    }, new Map<string, Set<string>>()),
  ).map(([targetPath, sessions]) => ({
    targetPath,
    sessions: sessions.size,
    share: onboardingLaunchCount > 0 ? sessions.size / onboardingLaunchCount : 0,
  })).sort((a, b) => b.sessions - a.sessions);
}

export function buildPersonalizationCoverage(committedRows: TelemetryRow[], personalizationRows: TelemetryRow[]): number {
  const committedCoverageKeys = new Set(
    committedRows.map((row) => `${row.email}:${row.track_slug}:${row.created_at.slice(0, 10)}`),
  );
  const personalizationCoverageKeys = new Set(
    personalizationRows.map((row) => `${row.email}:${row.track_slug}:${row.created_at.slice(0, 10)}`),
  );
  const matchedCoverageCount = Array.from(committedCoverageKeys).filter((key) => personalizationCoverageKeys.has(key)).length;

  return committedCoverageKeys.size > 0
    ? matchedCoverageCount / committedCoverageKeys.size
    : personalizationCoverageKeys.size > 0
      ? 1
      : 0;
}

export type TriageWithStatusRow = {
  trackSlug: string;
  stepIndex: number;
  total: number;
  stuckCount: number;
  stuckRate: number;
  stateDistribution?: FrictionMonitorMetrics['stateDistribution'];
  status: FrictionTriageStatus;
  owner: string | null;
  notes: string | null;
  updatedAt: string | null;
  updatedByEmail: string | null;
  riskScore: number;
};

export function buildTriageData(
  frictionMetrics: FrictionMonitorMetrics,
  frictionTriageRows: FetchedFrictionTriageRow[],
  queueStatus: QueueStatusKey,
  queueOwner: QueueOwnerKey,
): {
  hotspotsWithTriage: TriageWithStatusRow[];
  triageQueueRows: TriageWithStatusRow[];
  autoTriageEligibleRows: TriageWithStatusRow[];
  queueOwnerOptions: string[];
  triageByHotspot: Map<string, FetchedFrictionTriageRow>;
} {
  const triageByHotspot = new Map(
    frictionTriageRows.map((row) => [triageKey(row.track_slug, row.step_index), row] as const),
  );

  const hotspotsWithTriage = frictionMetrics.hotspots
    .map((row) => {
      const triage = triageByHotspot.get(triageKey(row.trackSlug, row.stepIndex));
      const status = triage?.status ?? 'new';
      const owner = triage?.owner?.trim().toLowerCase() || null;
      const riskScore = row.stuckRate * row.total;
      return {
        ...row,
        status,
        owner,
        notes: triage?.notes ?? null,
        updatedAt: triage?.updated_at ?? null,
        updatedByEmail: triage?.updated_by_email ?? null,
        riskScore,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const queueOwnerOptions = Array.from(
    new Set(hotspotsWithTriage.map((row) => row.owner).filter((owner): owner is string => !!owner)),
  ).sort();

  const triageQueueRows = hotspotsWithTriage.filter((row) => {
    const statusMatches =
      queueStatus === 'open'
        ? row.status !== 'resolved'
        : queueStatus === 'all'
          ? true
          : row.status === queueStatus;
    const ownerMatches =
      queueOwner === 'all'
        ? true
        : queueOwner === 'unassigned'
          ? !row.owner
          : row.owner === queueOwner;
    return statusMatches && ownerMatches;
  });

  const autoTriageEligibleRows = triageQueueRows.filter((row) => {
    if (row.status === 'resolved') return false;
    if (!row.updatedAt) return true;
    const ageMinutes = (Date.now() - new Date(row.updatedAt).getTime()) / (1000 * 60);
    return Number.isFinite(ageMinutes) && ageMinutes >= AUTO_TRIAGE_MINUTES_COOLDOWN;
  });

  return {
    hotspotsWithTriage,
    triageQueueRows,
    autoTriageEligibleRows,
    queueOwnerOptions,
    triageByHotspot,
  };
}

export function buildDynamicTracks(
  committedRows: TelemetryRow[],
  frictionSnapshots: FrictionSnapshotInput[],
  firstWinShownRows: TelemetryRow[],
  personalizationRows: TelemetryRow[],
  defaultTracks: readonly string[],
): string[] {
  const dynamicTracks = Array.from(new Set([
    ...committedRows.map((row) => row.track_slug),
    ...frictionSnapshots.map((row) => row.trackSlug),
    ...firstWinShownRows.map((row) => row.track_slug),
    ...personalizationRows.map((row) => row.track_slug),
  ].filter((value) => typeof value === 'string' && value.length > 0)));

  return Array.from(new Set<string>([...defaultTracks, ...dynamicTracks]));
}
