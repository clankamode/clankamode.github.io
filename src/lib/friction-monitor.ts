import type { FrictionState, FrictionTrigger } from '@/types/friction';

export interface FrictionSnapshotInput {
  createdAt: string;
  trackSlug: string;
  stepIndex: number;
  frictionState: FrictionState;
  trigger: FrictionTrigger;
  confidence: number;
}

export interface FrictionDistributionRow {
  state: FrictionState;
  count: number;
  share: number;
}

export interface TriggerDistributionRow {
  trigger: FrictionTrigger;
  count: number;
  share: number;
}

export interface ConfidenceBandRow {
  band: string;
  count: number;
  share: number;
}

export interface StuckHotspotRow {
  trackSlug: string;
  stepIndex: number;
  total: number;
  stuckCount: number;
  stuckRate: number;
}

export interface DailyStuckRow {
  date: string;
  total: number;
  stuckCount: number;
  stuckRate: number;
}

export interface FrictionMonitorMetrics {
  totalSnapshots: number;
  stateDistribution: FrictionDistributionRow[];
  triggerDistribution: TriggerDistributionRow[];
  confidenceBands: ConfidenceBandRow[];
  dailyStuck: DailyStuckRow[];
  dailyAlerts: DailyStuckRow[];
  hotspots: StuckHotspotRow[];
}

const STATES: FrictionState[] = ['flow', 'stuck', 'drift', 'fatigue', 'coast'];
const TRIGGERS: FrictionTrigger[] = ['state_change', 'step_exit'];

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function asShare(count: number, total: number): number {
  if (total <= 0) return 0;
  return count / total;
}

function confidenceBand(confidence: number): string {
  if (confidence < 0.6) return '<0.60';
  if (confidence < 0.75) return '0.60-0.74';
  if (confidence < 0.9) return '0.75-0.89';
  return '>=0.90';
}

export function buildFrictionMonitorMetrics(
  snapshots: FrictionSnapshotInput[],
  options?: { alertThreshold?: number; hotspotMinSamples?: number }
): FrictionMonitorMetrics {
  const alertThreshold = options?.alertThreshold ?? 0.3;
  const hotspotMinSamples = options?.hotspotMinSamples ?? 3;

  const total = snapshots.length;

  const stateCounts = new Map<FrictionState, number>(STATES.map((state) => [state, 0]));
  const triggerCounts = new Map<FrictionTrigger, number>(TRIGGERS.map((trigger) => [trigger, 0]));
  const bandCounts = new Map<string, number>([
    ['<0.60', 0],
    ['0.60-0.74', 0],
    ['0.75-0.89', 0],
    ['>=0.90', 0],
  ]);
  const dailyCounts = new Map<string, { total: number; stuckCount: number }>();
  const hotspotCounts = new Map<string, { trackSlug: string; stepIndex: number; total: number; stuckCount: number }>();

  for (const snapshot of snapshots) {
    stateCounts.set(snapshot.frictionState, (stateCounts.get(snapshot.frictionState) || 0) + 1);
    triggerCounts.set(snapshot.trigger, (triggerCounts.get(snapshot.trigger) || 0) + 1);
    const band = confidenceBand(snapshot.confidence);
    bandCounts.set(band, (bandCounts.get(band) || 0) + 1);

    const date = dayKey(new Date(snapshot.createdAt));
    const daily = dailyCounts.get(date) || { total: 0, stuckCount: 0 };
    daily.total += 1;
    if (snapshot.frictionState === 'stuck') daily.stuckCount += 1;
    dailyCounts.set(date, daily);

    const hotspotKey = `${snapshot.trackSlug}:${snapshot.stepIndex}`;
    const hotspot = hotspotCounts.get(hotspotKey) || {
      trackSlug: snapshot.trackSlug,
      stepIndex: snapshot.stepIndex,
      total: 0,
      stuckCount: 0,
    };
    hotspot.total += 1;
    if (snapshot.frictionState === 'stuck') hotspot.stuckCount += 1;
    hotspotCounts.set(hotspotKey, hotspot);
  }

  const stateDistribution = STATES
    .map((state) => ({
      state,
      count: stateCounts.get(state) || 0,
      share: asShare(stateCounts.get(state) || 0, total),
    }))
    .sort((a, b) => b.count - a.count);

  const triggerDistribution = TRIGGERS
    .map((trigger) => ({
      trigger,
      count: triggerCounts.get(trigger) || 0,
      share: asShare(triggerCounts.get(trigger) || 0, total),
    }))
    .sort((a, b) => b.count - a.count);

  const confidenceBands = ['<0.60', '0.60-0.74', '0.75-0.89', '>=0.90']
    .map((band) => ({
      band,
      count: bandCounts.get(band) || 0,
      share: asShare(bandCounts.get(band) || 0, total),
    }));

  const dailyStuck = Array.from(dailyCounts.entries())
    .map(([date, counts]) => ({
      date,
      total: counts.total,
      stuckCount: counts.stuckCount,
      stuckRate: asShare(counts.stuckCount, counts.total),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const dailyAlerts = dailyStuck.filter((row) => row.stuckRate > alertThreshold);

  const hotspots = Array.from(hotspotCounts.values())
    .map((row) => ({
      trackSlug: row.trackSlug,
      stepIndex: row.stepIndex,
      total: row.total,
      stuckCount: row.stuckCount,
      stuckRate: asShare(row.stuckCount, row.total),
    }))
    .filter((row) => row.total >= hotspotMinSamples)
    .sort((a, b) => {
      if (a.stuckRate !== b.stuckRate) return b.stuckRate - a.stuckRate;
      return b.total - a.total;
    });

  return {
    totalSnapshots: total,
    stateDistribution,
    triggerDistribution,
    confidenceBands,
    dailyStuck,
    dailyAlerts,
    hotspots,
  };
}
