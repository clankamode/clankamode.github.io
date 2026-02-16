type DecisionReplayRow = {
  id: string;
  created_at: string;
  decision_type: string;
  decision_mode: string;
  track_slug: string;
  step_index: number;
  actor_email: string;
  confidence: number | null;
  source: string;
  output_json: Record<string, unknown> | null;
};

type TriageAuditReplayRow = {
  created_at: string;
  action_type: string;
  track_slug: string;
  step_index: number;
  after_status: string | null;
  after_owner: string | null;
};

type CalibrationBucket = 'high' | 'medium' | 'low' | 'unknown';

export type AIDecisionReviewOutcome = 'confirmed' | 'overridden' | 'inconclusive' | 'unreviewed';
export type AIDecisionReviewLabel = 'confirmed' | 'overridden' | 'inconclusive';

export type AIDecisionReplayRecentRow = {
  id: string;
  createdAt: string;
  decisionType: string;
  decisionMode: string;
  trackSlug: string;
  stepIndex: number;
  actorEmail: string;
  confidence: number | null;
  source: string;
  overriddenWithin24h: boolean;
  reviewOutcome: AIDecisionReviewOutcome;
  reviewLabel: AIDecisionReviewLabel | null;
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  minutesToFirstManualUpdate: number | null;
};

export type AIDecisionReplayGroupRow = {
  decisionType: string;
  decisionMode: string;
  total: number;
  overrides: number;
  overrideRate: number;
};

export type AIDecisionReplaySourceRow = {
  source: string;
  total: number;
  overrides: number;
  overrideRate: number;
};

export type AIDecisionReplayHotspotRow = {
  trackSlug: string;
  stepIndex: number;
  total: number;
  overrides: number;
  overrideRate: number;
};

export type AIDecisionReplayCalibrationRow = {
  bucket: CalibrationBucket;
  total: number;
  overrides: number;
  overrideRate: number;
};

export type AIDecisionReplayInsight = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
};

export type AIDecisionReplaySummary = {
  totalDecisions: number;
  groups: AIDecisionReplayGroupRow[];
  sources: AIDecisionReplaySourceRow[];
  hotspots: AIDecisionReplayHotspotRow[];
  confidence: {
    average: number | null;
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
  outcomes: {
    confirmed: number;
    overridden: number;
    inconclusive: number;
    unreviewed: number;
    confirmedRate: number;
    overriddenRate: number;
    inconclusiveRate: number;
    unreviewedRate: number;
  };
  reviewLatency: {
    p50Minutes: number | null;
    p90Minutes: number | null;
    sampleCount: number;
  };
  calibration: AIDecisionReplayCalibrationRow[];
  insights: AIDecisionReplayInsight[];
  recent: AIDecisionReplayRecentRow[];
};

type ReplayFilterOptions = {
  recentLimit?: number;
  decisionType?: string | null;
  decisionMode?: string | null;
  source?: string | null;
  reviewOutcome?: AIDecisionReviewOutcome | 'all' | null;
};

function toLowerOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function toReviewLabel(value: unknown): AIDecisionReviewLabel | null {
  if (value === 'confirmed' || value === 'overridden' || value === 'inconclusive') return value;
  return null;
}

function toReviewOutcome(label: AIDecisionReviewLabel | null, inferredOverride: boolean, hasReviewSignal: boolean): AIDecisionReviewOutcome {
  if (label) return label;
  if (!hasReviewSignal) return 'unreviewed';
  return inferredOverride ? 'overridden' : 'confirmed';
}

function matchesFilter(row: DecisionReplayRow, options: ReplayFilterOptions): boolean {
  if (options.decisionType && row.decision_type !== options.decisionType) return false;
  if (options.decisionMode && row.decision_mode !== options.decisionMode) return false;
  if (options.source && row.source !== options.source) return false;
  return true;
}

function toRate(total: number, part: number): number {
  return total > 0 ? part / total : 0;
}

function toPercentile(sortedValues: number[], p: number): number | null {
  if (sortedValues.length === 0) return null;
  const rank = Math.ceil((p / 100) * sortedValues.length) - 1;
  const index = Math.min(Math.max(rank, 0), sortedValues.length - 1);
  return sortedValues[index] ?? null;
}

function confidenceBucket(confidence: number | null): CalibrationBucket {
  if (confidence === null || !Number.isFinite(confidence)) return 'unknown';
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

function buildInsights(summary: Omit<AIDecisionReplaySummary, 'insights'>): AIDecisionReplayInsight[] {
  const insights: AIDecisionReplayInsight[] = [];
  if (summary.totalDecisions < 10) return insights;

  if (summary.outcomes.overriddenRate >= 0.35) {
    insights.push({
      id: 'high_override_pressure',
      severity: summary.outcomes.overriddenRate >= 0.5 ? 'critical' : 'warning',
      title: 'High override pressure',
      message: `Overrides are ${Math.round(summary.outcomes.overriddenRate * 100)}% of AI decisions. Focus on top override hotspots first.`,
    });
  }

  if (summary.outcomes.unreviewedRate >= 0.5) {
    insights.push({
      id: 'low_review_coverage',
      severity: 'warning',
      title: 'Low human review coverage',
      message: `${Math.round(summary.outcomes.unreviewedRate * 100)}% of AI decisions remain unreviewed. Add explicit adjudication ownership.`,
    });
  }

  if (summary.reviewLatency.sampleCount >= 8 && summary.reviewLatency.p90Minutes !== null && summary.reviewLatency.p90Minutes >= 360) {
    insights.push({
      id: 'slow_feedback_loop',
      severity: 'warning',
      title: 'Slow feedback loop',
      message: `p90 review latency is ${Math.round(summary.reviewLatency.p90Minutes)} minutes. Tighten triage follow-up loops.`,
    });
  }

  const high = summary.calibration.find((row) => row.bucket === 'high');
  const low = summary.calibration.find((row) => row.bucket === 'low');
  if (high && low && high.total >= 5 && low.total >= 5 && high.overrideRate > low.overrideRate + 0.1) {
    insights.push({
      id: 'calibration_inversion',
      severity: 'critical',
      title: 'Confidence calibration inversion',
      message: 'High-confidence decisions are overridden more often than low-confidence decisions.',
    });
  }

  return insights.slice(0, 4);
}

export function buildAIDecisionReplaySummary(
  decisions: DecisionReplayRow[],
  audits: TriageAuditReplayRow[],
  options?: ReplayFilterOptions
): AIDecisionReplaySummary {
  const recentLimit = options?.recentLimit ?? 30;
  const filteredDecisions = decisions.filter((row) => matchesFilter(row, options ?? {}));
  const manualByHotspot = new Map<string, TriageAuditReplayRow[]>();

  for (const row of audits) {
    if (row.action_type !== 'manual_update') continue;
    const key = `${row.track_slug}:${row.step_index}`;
    const list = manualByHotspot.get(key) || [];
    list.push(row);
    manualByHotspot.set(key, list);
  }

  const grouped = new Map<string, { total: number; overrides: number }>();
  const sourceGrouped = new Map<string, { total: number; overrides: number }>();
  const hotspotGrouped = new Map<string, { total: number; overrides: number }>();
  const calibrationBuckets = new Map<CalibrationBucket, { total: number; overrides: number }>();
  const latencyMinutes: number[] = [];
  let confidenceSum = 0;
  let confidenceCount = 0;
  let confirmed = 0;
  let overridden = 0;
  let inconclusive = 0;
  let unreviewed = 0;

  const annotated = filteredDecisions.map((decision) => {
    const key = `${decision.track_slug}:${decision.step_index}`;
    const manualRows = (manualByHotspot.get(key) || []).slice().sort((a, b) => (
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));
    const decisionCreatedAt = new Date(decision.created_at).getTime();
    const horizon = decisionCreatedAt + 24 * 60 * 60 * 1000;
    const decisionStatus = toLowerOrNull(decision.output_json?.appliedStatus);
    const decisionOwner = toLowerOrNull(decision.output_json?.appliedOwner);

    const manualWithinWindow = manualRows.filter((manual) => {
      const manualTime = new Date(manual.created_at).getTime();
      return manualTime >= decisionCreatedAt && manualTime <= horizon;
    });

    const firstManual = manualWithinWindow[0];
    const minutesToFirstManualUpdate = firstManual
      ? (new Date(firstManual.created_at).getTime() - decisionCreatedAt) / (1000 * 60)
      : null;

    let inferredOverride = false;
    for (const manual of manualWithinWindow) {
      const manualStatus = toLowerOrNull(manual.after_status);
      const manualOwner = toLowerOrNull(manual.after_owner);
      if (manualStatus !== decisionStatus || manualOwner !== decisionOwner) {
        inferredOverride = true;
        break;
      }
    }

    const reviewLabel = toReviewLabel(decision.output_json?.reviewLabel);
    const reviewNotes = typeof decision.output_json?.reviewNotes === 'string'
      ? decision.output_json.reviewNotes.slice(0, 400)
      : null;
    const reviewedBy = typeof decision.output_json?.reviewedBy === 'string'
      ? decision.output_json.reviewedBy
      : null;
    const reviewedAt = toIsoOrNull(decision.output_json?.reviewedAt);
    const explicitReviewMinutes = reviewedAt
      ? (new Date(reviewedAt).getTime() - decisionCreatedAt) / (1000 * 60)
      : null;
    const effectiveReviewMinutes = explicitReviewMinutes !== null && Number.isFinite(explicitReviewMinutes)
      ? explicitReviewMinutes
      : minutesToFirstManualUpdate;

    if (effectiveReviewMinutes !== null && Number.isFinite(effectiveReviewMinutes) && effectiveReviewMinutes >= 0) {
      latencyMinutes.push(effectiveReviewMinutes);
    }

    const hasReviewSignal = reviewLabel !== null || manualWithinWindow.length > 0 || reviewedAt !== null;
    const reviewOutcome = toReviewOutcome(reviewLabel, inferredOverride, hasReviewSignal);

    if (reviewOutcome === 'overridden') overridden += 1;
    else if (reviewOutcome === 'confirmed') confirmed += 1;
    else if (reviewOutcome === 'inconclusive') inconclusive += 1;
    else unreviewed += 1;

    const overrideForRate = reviewOutcome === 'overridden';
    const groupKey = `${decision.decision_type}:${decision.decision_mode}`;
    const groupBucket = grouped.get(groupKey) || { total: 0, overrides: 0 };
    groupBucket.total += 1;
    if (overrideForRate) groupBucket.overrides += 1;
    grouped.set(groupKey, groupBucket);

    const sourceBucket = sourceGrouped.get(decision.source) || { total: 0, overrides: 0 };
    sourceBucket.total += 1;
    if (overrideForRate) sourceBucket.overrides += 1;
    sourceGrouped.set(decision.source, sourceBucket);

    const hotspotKey = `${decision.track_slug}:${decision.step_index}`;
    const hotspotBucket = hotspotGrouped.get(hotspotKey) || { total: 0, overrides: 0 };
    hotspotBucket.total += 1;
    if (overrideForRate) hotspotBucket.overrides += 1;
    hotspotGrouped.set(hotspotKey, hotspotBucket);

    const bucket = confidenceBucket(decision.confidence);
    const calibration = calibrationBuckets.get(bucket) || { total: 0, overrides: 0 };
    calibration.total += 1;
    if (overrideForRate) calibration.overrides += 1;
    calibrationBuckets.set(bucket, calibration);

    if (typeof decision.confidence === 'number') {
      confidenceCount += 1;
      confidenceSum += decision.confidence;
    }

    return {
      decision,
      inferredOverride,
      reviewOutcome,
      reviewLabel,
      reviewNotes,
      reviewedBy,
      reviewedAt,
      minutesToFirstManualUpdate: effectiveReviewMinutes,
    };
  });

  const outcomeFilter = options?.reviewOutcome ?? null;
  const outcomeFiltered = outcomeFilter && outcomeFilter !== 'all'
    ? annotated.filter((row) => row.reviewOutcome === outcomeFilter)
    : annotated;

  const groups = Array.from(grouped.entries())
    .map(([key, value]) => {
      const [decisionType, decisionMode] = key.split(':');
      return {
        decisionType,
        decisionMode,
        total: value.total,
        overrides: value.overrides,
        overrideRate: toRate(value.total, value.overrides),
      };
    })
    .sort((a, b) => b.total - a.total || b.overrideRate - a.overrideRate);

  const sources = Array.from(sourceGrouped.entries())
    .map(([source, value]) => ({
      source,
      total: value.total,
      overrides: value.overrides,
      overrideRate: toRate(value.total, value.overrides),
    }))
    .sort((a, b) => b.total - a.total || b.overrideRate - a.overrideRate);

  const hotspots = Array.from(hotspotGrouped.entries())
    .map(([key, value]) => {
      const [trackSlug, stepIndexRaw] = key.split(':');
      const stepIndex = Number(stepIndexRaw);
      return {
        trackSlug,
        stepIndex,
        total: value.total,
        overrides: value.overrides,
        overrideRate: toRate(value.total, value.overrides),
      };
    })
    .sort((a, b) => b.overrides - a.overrides || b.total - a.total)
    .slice(0, 15);

  const calibrationOrder: CalibrationBucket[] = ['high', 'medium', 'low', 'unknown'];
  const calibration = calibrationOrder.map((bucket) => {
    const value = calibrationBuckets.get(bucket) || { total: 0, overrides: 0 };
    return {
      bucket,
      total: value.total,
      overrides: value.overrides,
      overrideRate: toRate(value.total, value.overrides),
    };
  });

  const recent = outcomeFiltered.slice(0, recentLimit).map((row) => ({
    id: row.decision.id,
    createdAt: row.decision.created_at,
    decisionType: row.decision.decision_type,
    decisionMode: row.decision.decision_mode,
    trackSlug: row.decision.track_slug,
    stepIndex: row.decision.step_index,
    actorEmail: row.decision.actor_email,
    confidence: row.decision.confidence,
    source: row.decision.source,
    overriddenWithin24h: row.inferredOverride,
    reviewOutcome: row.reviewOutcome,
    reviewLabel: row.reviewLabel,
    reviewNotes: row.reviewNotes,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    minutesToFirstManualUpdate: row.minutesToFirstManualUpdate === null ? null : Number(row.minutesToFirstManualUpdate.toFixed(1)),
  }));

  const sortedLatency = latencyMinutes.slice().sort((a, b) => a - b);
  const summaryBase = {
    totalDecisions: filteredDecisions.length,
    groups,
    sources,
    hotspots,
    confidence: {
      average: confidenceCount > 0 ? confidenceSum / confidenceCount : null,
      high: calibrationBuckets.get('high')?.total ?? 0,
      medium: calibrationBuckets.get('medium')?.total ?? 0,
      low: calibrationBuckets.get('low')?.total ?? 0,
      unknown: calibrationBuckets.get('unknown')?.total ?? 0,
    },
    outcomes: {
      confirmed,
      overridden,
      inconclusive,
      unreviewed,
      confirmedRate: toRate(filteredDecisions.length, confirmed),
      overriddenRate: toRate(filteredDecisions.length, overridden),
      inconclusiveRate: toRate(filteredDecisions.length, inconclusive),
      unreviewedRate: toRate(filteredDecisions.length, unreviewed),
    },
    reviewLatency: {
      p50Minutes: toPercentile(sortedLatency, 50),
      p90Minutes: toPercentile(sortedLatency, 90),
      sampleCount: sortedLatency.length,
    },
    calibration,
    recent,
  };

  return {
    ...summaryBase,
    insights: buildInsights(summaryBase),
  };
}
