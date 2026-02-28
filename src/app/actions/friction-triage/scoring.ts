import { average } from './utils';
import type { BriefEvidence, SnapshotEvidenceRow, TelemetryEvidenceRow, TriageTopEvent, TriageLatestSnapshot } from './types';

export function getUniqueSessionIds(rows: SnapshotEvidenceRow[], limit = 60): string[] {
  return Array.from(new Set(rows.map((row) => row.session_id))).slice(0, limit);
}

export function calculateStuckRate(rows: SnapshotEvidenceRow[]): number {
  const stuckCount = rows.filter((row) => row.friction_state === 'stuck').length;
  return rows.length > 0 ? stuckCount / rows.length : 0;
}

export function calculateAverageConfidence(rows: SnapshotEvidenceRow[]): number {
  return average(rows.map((row) => Number(row.confidence) || 0));
}

export function calculateAverageElapsedRatio(rows: SnapshotEvidenceRow[]): number {
  const elapsedRatios = rows
    .map((row) => {
      const elapsed = Number(row.signals?.elapsedMs);
      const estimated = Number(row.signals?.estimatedMs);
      if (!Number.isFinite(elapsed) || !Number.isFinite(estimated) || estimated <= 0) return null;
      return elapsed / estimated;
    })
    .filter((value): value is number => value !== null);
  return average(elapsedRatios);
}

export function calculateAveragePracticeBlockedCount(rows: SnapshotEvidenceRow[]): number {
  return average(
    rows
      .map((row) => Number(row.signals?.practiceBlockedCount))
      .filter((value) => Number.isFinite(value))
  );
}

export function calculateAverageChunkToggleCount(rows: SnapshotEvidenceRow[]): number {
  return average(
    rows
      .map((row) => Number(row.signals?.chunkNextCount || 0) + Number(row.signals?.chunkPrevCount || 0))
      .filter((value) => Number.isFinite(value))
  );
}

export function summarizeTelemetryEvents(rows: TelemetryEvidenceRow[], limit = 6): TriageTopEvent[] {
  const eventCounts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.event_type] = (acc[row.event_type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([eventType, count]) => ({ eventType, count }));
}

export function buildBriefEvidence(params: {
  trackSlug: string;
  stepIndex: number;
  lookbackDays: number;
  snapshots: SnapshotEvidenceRow[];
  telemetry: TelemetryEvidenceRow[];
  sessionIds: string[];
}): BriefEvidence {
  const stuckRate = calculateStuckRate(params.snapshots);
  const averageConfidence = calculateAverageConfidence(params.snapshots);
  const averageElapsedRatio = calculateAverageElapsedRatio(params.snapshots);
  const averagePracticeBlockedCount = calculateAveragePracticeBlockedCount(params.snapshots);
  const averageChunkToggleCount = calculateAverageChunkToggleCount(params.snapshots);

  const topEvents = summarizeTelemetryEvents(params.telemetry);
  const latestSnapshots: TriageLatestSnapshot[] = params.snapshots.slice(0, 12).map((row) => ({
    createdAt: row.created_at,
    state: row.friction_state,
    trigger: row.trigger,
    confidence: Number(row.confidence),
  }));

  return {
    trackSlug: params.trackSlug,
    stepIndex: params.stepIndex,
    lookbackDays: params.lookbackDays,
    sampleSize: params.snapshots.length,
    uniqueSessions: params.sessionIds.length,
    stuckRate,
    averageConfidence,
    averageElapsedRatio,
    averagePracticeBlockedCount,
    averageChunkToggleCount,
    topEvents,
    latestSnapshots,
  };
}
