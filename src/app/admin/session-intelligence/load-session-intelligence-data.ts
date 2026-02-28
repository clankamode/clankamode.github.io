import { buildFunnelByFirstItem, buildRepeatAnalysis, normalizeTelemetryHref, type CommittedEventInput, type CompletedEventInput } from '@/lib/session-recommendation-quality';
import { buildFrictionMonitorMetrics } from '@/lib/friction-monitor';
import { buildAIDecisionReplaySummary } from '@/lib/session-ai-replay';
import { buildTransferScoreV0 } from '@/lib/transfer-score';
import { buildPersonalizationInsights } from '@/lib/session-personalization';
import { buildSessionOperatorActions } from '@/lib/session-operator-actions';
import { percentile95 } from './utils';
import {
  buildDynamicTracks,
  buildGoalBreakdown,
  buildLaunchPathBreakdown,
  buildPersonalizationCoverage,
  buildTriageData,
} from './filter-sort';
import {
  fetchAIDecisionAuditRows,
  fetchAIDecisionRows,
  fetchFrictionDrilldown,
  fetchFrictionSnapshots,
  fetchFrictionTriageAuditRows,
  fetchFrictionTriageRows,
  fetchTelemetryRows,
} from './queries';
import { parseScopeCohort, parseScopeEligible, parsePersonalizationSnapshot } from './utils';
import {
  buildUserKey,
} from './utils';
import type {
  FetchedFrictionTriageAuditRow,
  FetchedFrictionTriageRow,
  LaunchPathRow,
  OnboardingFunnelRow,
  ScopeCohort,
  SessionIntelligenceLoadResult,
  TelemetryRow,
  QualityRowSet,
  FrictionRowSet,
  ParsedSessionIntelligenceParams,
  CohortFunnelRow,
  CohortTransferRow,
  PolicyLatencyRow,
} from './types';
import { RANGE_DAYS, DEFAULT_TRACKS } from './params';
import type { AIDecisionReplaySummary } from '@/lib/session-ai-replay';
import type { PersonalizationInsights } from '@/lib/session-personalization';
import type { SessionOperatorAction } from '@/lib/session-operator-actions';
import type { TransferScoreResult } from '@/lib/transfer-score';

export type {
  QualityRowSet,
  FrictionRowSet,
};

function buildCohortFunnelRows(
  cohortSessionSets: Map<ScopeCohort, Set<string>>,
  allCohorts: ScopeCohort[],
  finalizedRows: TelemetryRow[],
) {
  return allCohorts
    .map((cohort) => {
      const sessions = cohortSessionSets.get(cohort) ?? new Set<string>();
      const committedCount = sessions.size;
      const finalizedCount = new Set(
        finalizedRows
          .map((row) => row.session_id)
          .filter((sessionId) => sessions.has(sessionId)),
      ).size;
      const finalizedRate = committedCount > 0 ? finalizedCount / committedCount : 0;

      return {
        cohort,
        committedCount,
        finalizedCount,
        finalizedRate,
      };
    })
    .filter((row) => row.committedCount > 0) as CohortFunnelRow[];
}

export async function loadSessionIntelligenceData(
  params: ParsedSessionIntelligenceParams,
): Promise<SessionIntelligenceLoadResult> {
  const sinceIso = new Date(Date.now() - RANGE_DAYS[params.range] * 24 * 60 * 60 * 1000).toISOString();

  const [
    committedRows,
    completedRows,
    finalizedRows,
    frictionSnapshots,
    frictionTriageRows,
    aiDecisionRows,
    aiAuditRows,
    firstWinShownRows,
    firstWinGoalRows,
    firstWinPlanRows,
    firstWinLaunchRows,
    personalizationRows,
    ritualRows,
    blockedRows,
  ] = await Promise.all([
    fetchTelemetryRows('session_committed', sinceIso, params.track),
    fetchTelemetryRows('item_completed', sinceIso, params.track),
    fetchTelemetryRows('session_finalized', sinceIso, params.track),
    fetchFrictionSnapshots(sinceIso, params.track),
    fetchFrictionTriageRows(params.track),
    fetchAIDecisionRows(sinceIso, params.track),
    fetchAIDecisionAuditRows(sinceIso, params.track),
    fetchTelemetryRows('first_win_run_shown', sinceIso, 'onboarding'),
    fetchTelemetryRows('first_win_goal_selected', sinceIso, 'onboarding'),
    fetchTelemetryRows('first_win_plan_generated', sinceIso, 'onboarding'),
    fetchTelemetryRows('first_win_launched', sinceIso, 'onboarding'),
    fetchTelemetryRows('personalization_profile_scored', sinceIso, params.track),
    fetchTelemetryRows('ritual_completed', sinceIso, params.track),
    fetchTelemetryRows('practice_completion_blocked', sinceIso, params.track),
  ]);

  const committedEvents: CommittedEventInput[] = committedRows
    .map((row) => {
      const href = row.payload && typeof row.payload.itemHref === 'string'
        ? normalizeTelemetryHref(row.payload.itemHref)
        : null;
      if (!href) {
        return null;
      }
      return {
        userKey: buildUserKey(row.email, row.google_id),
        createdAt: row.created_at,
        href,
        sessionId: row.session_id,
      } satisfies CommittedEventInput;
    })
    .filter((row): row is CommittedEventInput => !!row);

  const completedEvents: CompletedEventInput[] = completedRows
    .map((row) => {
      const href = row.payload && typeof row.payload.itemHref === 'string'
        ? normalizeTelemetryHref(row.payload.itemHref)
        : null;
      if (!href) {
        return null;
      }
      return {
        sessionId: row.session_id,
        createdAt: row.created_at,
        href,
      };
    })
    .filter((row): row is CompletedEventInput => !!row);

  const finalizedEvents = finalizedRows.map((row) => ({
    sessionId: row.session_id,
    createdAt: row.created_at,
  }));

  const repeatAnalysis = buildRepeatAnalysis(committedEvents, { lookbackDays: 7, alertThreshold: 0.2 });
  const committedSessionCount = new Set(committedRows.map((row) => row.session_id)).size;
  const lowSampleSize = committedSessionCount < 20;
  const funnel = buildFunnelByFirstItem(committedEvents, completedEvents, finalizedEvents).slice(0, 12);
  const repeatedItems = repeatAnalysis.itemRepeats.filter((item) => item.repeatedCount > 0).slice(0, 12);

  const onboardingShownSessions = new Set(firstWinShownRows.map((row) => row.session_id));
  const onboardingGoalSessions = new Set(firstWinGoalRows.map((row) => row.session_id));
  const onboardingPlanSessions = new Set(firstWinPlanRows.map((row) => row.session_id));
  const onboardingLaunchSessions = new Set(firstWinLaunchRows.map((row) => row.session_id));

  const onboardingShownCount = onboardingShownSessions.size;
  const onboardingGoalCount = onboardingGoalSessions.size;
  const onboardingPlanCount = onboardingPlanSessions.size;
  const onboardingLaunchCount = onboardingLaunchSessions.size;
  const onboardingGoalConversion = onboardingShownCount > 0 ? onboardingGoalCount / onboardingShownCount : 0;
  const onboardingPlanConversion = onboardingShownCount > 0 ? onboardingPlanCount / onboardingShownCount : 0;
  const onboardingLaunchConversion = onboardingShownCount > 0 ? onboardingLaunchCount / onboardingShownCount : 0;
  const onboardingDropAfterShown = Math.max(0, onboardingShownCount - onboardingGoalCount);
  const onboardingDropAfterGoal = Math.max(0, onboardingGoalCount - onboardingPlanCount);
  const onboardingDropAfterPlan = Math.max(0, onboardingPlanCount - onboardingLaunchCount);

  const personalizationSnapshots = personalizationRows
    .map((row) => parsePersonalizationSnapshot(row))
    .filter((row): row is NonNullable<ReturnType<typeof parsePersonalizationSnapshot>> => !!row);
  const personalizationInsights = buildPersonalizationInsights(personalizationSnapshots);
  const personalizationCoverage = buildPersonalizationCoverage(committedRows, personalizationRows);

  const transferScoreV0 = buildTransferScoreV0({
    committedRows,
    finalizedRows,
    ritualRows,
    blockedRows,
  });

  const cohortBySession = new Map<string, ScopeCohort>();
  for (const row of committedRows) {
    const cohort = parseScopeCohort(row.payload);
    if (!cohortBySession.has(row.session_id) || cohort !== 'unknown') {
      cohortBySession.set(row.session_id, cohort);
    }
  }

  for (const row of finalizedRows) {
    if (cohortBySession.has(row.session_id)) continue;
    cohortBySession.set(row.session_id, parseScopeCohort(row.payload));
  }

  const cohortSessionSets = new Map<ScopeCohort, Set<string>>();
  for (const [sessionId, cohort] of cohortBySession.entries()) {
    const set = cohortSessionSets.get(cohort) ?? new Set<string>();
    set.add(sessionId);
    cohortSessionSets.set(cohort, set);
  }

  const allCohorts: ScopeCohort[] = ['control', 'treatment', 'not_eligible', 'unknown'];
  const cohortFunnelRows = buildCohortFunnelRows(cohortSessionSets, allCohorts, finalizedRows);

  const cohortTransferRows = (['control', 'treatment'] as const)
    .map((cohort) => {
      const sessions = cohortSessionSets.get(cohort) ?? new Set<string>();
      const transfer = buildTransferScoreV0({
        committedRows: committedRows.filter((row) => sessions.has(row.session_id)),
        finalizedRows: finalizedRows.filter((row) => sessions.has(row.session_id)),
        ritualRows: ritualRows.filter((row) => sessions.has(row.session_id)),
        blockedRows: blockedRows.filter((row) => sessions.has(row.session_id)),
      });
      return {
        cohort,
        committedCount: sessions.size,
        transfer,
      };
    })
    .filter((row) => row.committedCount > 0) as CohortTransferRow[];

  const controlCohort = cohortFunnelRows.find((row) => row.cohort === 'control');
  const treatmentCohort = cohortFunnelRows.find((row) => row.cohort === 'treatment');
  const finalizeRateDelta = controlCohort && treatmentCohort
    ? treatmentCohort.finalizedRate - controlCohort.finalizedRate
    : null;

  const controlTransfer = cohortTransferRows.find((row) => row.cohort === 'control');
  const treatmentTransfer = cohortTransferRows.find((row) => row.cohort === 'treatment');
  const transferScoreDelta = controlTransfer && treatmentTransfer
    ? treatmentTransfer.transfer.transferScore - controlTransfer.transfer.transferScore
    : null;

  const committedWithKnownCohort = committedRows.filter((row) => parseScopeCohort(row.payload) !== 'unknown').length;
  const missingCohortAttributionRate = committedRows.length > 0
    ? 1 - (committedWithKnownCohort / committedRows.length)
    : 0;

  const eligibleCommittedRows = committedRows.filter((row) => parseScopeEligible(row.payload));
  const eligibleAssignedRows = eligibleCommittedRows.filter((row) => {
    const cohort = parseScopeCohort(row.payload);
    return cohort === 'control' || cohort === 'treatment';
  });

  const eligibleCommittedRowsCount = eligibleCommittedRows.length;
  const eligibleAssignedRowsCount = eligibleAssignedRows.length;
  const assignedEligibleTotal = eligibleAssignedRowsCount > 0 ? eligibleAssignedRowsCount : 0;
  const eligibleButUnassignedRate = eligibleCommittedRowsCount > 0
    ? 1 - (eligibleAssignedRowsCount / eligibleCommittedRowsCount)
    : 0;
  const treatmentControlCounts = {
    control: eligibleAssignedRows.filter((row) => parseScopeCohort(row.payload) === 'control').length,
    treatment: eligibleAssignedRows.filter((row) => parseScopeCohort(row.payload) === 'treatment').length,
  };
  const treatmentShare = assignedEligibleTotal > 0 ? treatmentControlCounts.treatment / assignedEligibleTotal : 0;
  const sampleRatioMismatch = assignedEligibleTotal >= 20
    ? Math.abs(treatmentShare - 0.5) > 0.15
    : false;

  const policyDecisionRows = aiDecisionRows.filter((row) => (
    row.decision_type === 'session_plan'
    || row.decision_type === 'scope_policy'
    || row.decision_type === 'onboarding_path'
    || row.decision_type === 'triage_recommendation'
  ));

  const policyCoverageCount = committedRows.filter((row) => row.payload?.aiPolicyVersion === 'policy_os_v1').length;
  const policyCoverageRate = committedRows.length > 0 ? policyCoverageCount / committedRows.length : 0;
  const policyFallbackCount = policyDecisionRows.filter((row) => row.fallback_used).length;
  const policyFallbackRate = policyDecisionRows.length > 0
    ? policyFallbackCount / policyDecisionRows.length
    : 0;
  const policyParseFailureCount = policyDecisionRows.filter(
    (row) => row.error_code === 'parse_failed' || row.error_code === 'validation_failed',
  ).length;
  const policyParseFailureRate = policyDecisionRows.length > 0
    ? policyParseFailureCount / policyDecisionRows.length
    : 0;

  const policyLatencyByScope = ['planner', 'scope', 'onboarding', 'triage'].map((scope) => {
    const latencies = policyDecisionRows.flatMap((row) =>
      row.decision_scope === scope && typeof row.latency_ms === 'number' && row.latency_ms >= 0 ? [row.latency_ms] : [],
    );
    return {
      scope,
      p95LatencyMs: percentile95(latencies),
      count: latencies.length,
    };
  }) as PolicyLatencyRow[];

  const frictionMetrics = buildFrictionMonitorMetrics(frictionSnapshots, { alertThreshold: 0.3, hotspotMinSamples: 3 });
  const aiReplaySummary = buildAIDecisionReplaySummary(aiDecisionRows, aiAuditRows, {
    recentLimit: 20,
    decisionType: params.aiType === 'all' ? null : params.aiType,
    decisionMode: params.aiMode === 'all' ? null : params.aiMode,
    source: params.aiSource === 'all' ? null : params.aiSource,
    reviewOutcome: params.aiOutcome === 'all' ? null : params.aiOutcome,
  });

  const aiAssistGroup = aiReplaySummary.groups.find(
    (group) => group.decisionType === 'triage_recommendation' && group.decisionMode === 'assist',
  );
  const aiAutoGroup = aiReplaySummary.groups.find(
    (group) => group.decisionType === 'triage_recommendation' && group.decisionMode === 'auto',
  );

  const {
    hotspotsWithTriage,
    triageQueueRows,
    autoTriageEligibleRows,
    queueOwnerOptions,
    triageByHotspot,
  } = buildTriageData(frictionMetrics, frictionTriageRows, params.queueStatus, params.queueOwner);

  const trackOptions = buildDynamicTracks(committedRows, frictionSnapshots, firstWinShownRows, personalizationRows, DEFAULT_TRACKS);

  const goalBreakdown = buildGoalBreakdown(firstWinGoalRows, onboardingGoalCount);
  const launchPathBreakdown = buildLaunchPathBreakdown(firstWinLaunchRows, onboardingLaunchCount);

  const focusTrack = params.focusTrack;
  const focusStep = params.focusStep;
  const shouldLoadFrictionDrilldown =
    params.tab === 'friction' && typeof focusTrack === 'string' && typeof focusStep === 'number';
  const [frictionDrilldown, frictionTriageAuditRows] = shouldLoadFrictionDrilldown
    ? await Promise.all([
      fetchFrictionDrilldown(sinceIso, focusTrack, focusStep),
      fetchFrictionTriageAuditRows(focusTrack, focusStep),
    ])
    : [null, [] as FetchedFrictionTriageAuditRow[]];

  const focusedTriage = shouldLoadFrictionDrilldown
    ? triageByHotspot.get(`${focusTrack}:${focusStep}`) ?? null
    : null;

  const operatorActions = buildSessionOperatorActions({
    onboardingLaunchConversion,
    onboardingDropAfterShown,
    transferStatus: transferScoreV0.status,
    openFrictionHotspots: hotspotsWithTriage.filter((row) => row.status !== 'resolved').length,
    aiAssistOverrideRate: aiAssistGroup?.overrideRate ?? 0,
    aiAutoOverrideRate: aiAutoGroup?.overrideRate ?? 0,
    personalizationAtRiskShare: personalizationInsights.atRiskShare,
    personalizationLowAlignmentShare: personalizationInsights.lowAlignmentShare,
    personalizationCoverage,
  });

  const quality: QualityRowSet = {
    committedRowsCount: committedRows.length,
    committedSessionCount,
    lowSampleSize,
    repeatAnalysis,
    funnel,
    repeatedItems,
    goalBreakdown: goalBreakdown as OnboardingFunnelRow[],
    launchPathBreakdown: launchPathBreakdown as LaunchPathRow[],
    onboardingShownCount,
    onboardingGoalCount,
    onboardingPlanCount,
    onboardingLaunchCount,
    onboardingGoalConversion,
    onboardingPlanConversion,
    onboardingLaunchConversion,
    onboardingDropAfterShown,
    onboardingDropAfterGoal,
    onboardingDropAfterPlan,
    personalizationInsights: personalizationInsights as PersonalizationInsights,
    personalizationCoverage,
    transferScoreV0: transferScoreV0 as TransferScoreResult,
    cohortFunnelRows,
    cohortTransferRows,
    finalizeRateDelta,
    transferScoreDelta,
    committedWithKnownCohort,
    missingCohortAttributionRate,
    eligibleCommittedRowsCount,
    eligibleButUnassignedRate,
    eligibleAssignedRowsCount,
    treatmentShare,
    assignedEligibleTotal,
    sampleRatioMismatch,
    policyDecisionCount: policyDecisionRows.length,
    policyCoverageCount,
    policyCoverageRate,
    policyFallbackCount,
    policyFallbackRate,
    policyParseFailureCount,
    policyParseFailureRate,
    policyLatencyByScope,
    operatorActions: operatorActions as SessionOperatorAction[],
    committedEventsCount: committedEvents.length,
  };

  const friction: FrictionRowSet = {
    frictionMetrics,
    hotspotsWithTriage,
    triageQueueRows,
    autoTriageEligibleRows,
    queueOwnerOptions,
    triageByHotspot,
    aiReplaySummary: aiReplaySummary as AIDecisionReplaySummary,
    aiAssistGroup,
    aiAutoGroup,
    focusedTriage: focusedTriage as FetchedFrictionTriageRow | null,
    frictionDrilldown,
    frictionTriageAuditRows,
    focusTrack: params.focusTrack,
    focusStep: params.focusStep,
  };

  return {
    range: params.range,
    track: params.track,
    trackOptions,
    focusTrack: params.focusTrack,
    focusStep: params.focusStep,
    tab: params.tab,
    queueStatus: params.queueStatus,
    queueOwner: params.queueOwner,
    aiType: params.aiType,
    aiMode: params.aiMode,
    aiSource: params.aiSource,
    aiOutcome: params.aiOutcome,
    sinceIso,
    quality,
    friction,
  };
}
