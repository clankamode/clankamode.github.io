import Link from 'next/link';
import type { QualityRowSet } from '../types';
import { formatPercent, transferStatusClass } from '../utils';

type SessionIntelligenceQualityTabProps = {
  range: '1d' | '7d' | '14d' | '30d';
  quality: QualityRowSet;
};

export function SessionIntelligenceQualityTab({ range, quality }: SessionIntelligenceQualityTabProps) {
  const {
    lowSampleSize,
    committedSessionCount,
    repeatAnalysis,
    committedEventsCount,
    transferScoreV0,
    policyCoverageRate,
    policyDecisionCount,
    policyFallbackRate,
    policyFallbackCount,
    policyParseFailureCount,
    policyParseFailureRate,
    policyLatencyByScope,
    operatorActions,
    committedWithKnownCohort,
    finalizeRateDelta,
    transferScoreDelta,
    sampleRatioMismatch,
    missingCohortAttributionRate,
    eligibleCommittedRowsCount,
    eligibleButUnassignedRate,
    eligibleAssignedRowsCount,
    treatmentShare,
    assignedEligibleTotal,
    cohortFunnelRows,
    cohortTransferRows,
    personalizationInsights,
    personalizationCoverage,
    onboardingGoalConversion,
    onboardingPlanConversion,
    onboardingLaunchConversion,
    funnel,
    repeatedItems,
    onboardingShownCount,
    onboardingGoalCount,
    onboardingPlanCount,
    onboardingLaunchCount,
    onboardingDropAfterShown,
    onboardingDropAfterGoal,
    onboardingDropAfterPlan,
    goalBreakdown,
    launchPathBreakdown,
    policyCoverageCount,
  } = quality;

  return (
    <>
      <section className={`mb-6 rounded-lg border px-4 py-3 ${lowSampleSize ? 'border-amber-700/40 bg-amber-950/20' : 'border-emerald-700/30 bg-emerald-950/15'}`}>
        <p className="text-sm text-text-primary">
          <span className={`mr-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${lowSampleSize ? 'border-amber-700/50 text-amber-300' : 'border-emerald-700/50 text-emerald-300'}`}>
            {lowSampleSize ? 'Directional' : 'Stable'}
          </span>
          {lowSampleSize
            ? `Only ${committedSessionCount} committed sessions in this window. Treat these rates as directional until at least 20 sessions.`
            : `${committedSessionCount} committed sessions in this window. Comparison metrics are now stable enough for operator decisions.`}
        </p>
      </section>

      <div className="mb-8 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border-subtle bg-surface-interactive p-3">
          <p className="text-xs uppercase tracking-wider text-text-secondary">Latest Daily Repeat Rate</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {repeatAnalysis.daily[0] ? formatPercent(repeatAnalysis.daily[0].repeatRate) : '0.0%'}
          </p>
          {repeatAnalysis.daily[0] && (
            <p className="mt-1 text-xs text-text-secondary">
              {repeatAnalysis.daily[0].repeatedCommitted}/{repeatAnalysis.daily[0].totalCommitted} repeated sessions
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-interactive p-3">
          <p className="text-xs uppercase tracking-wider text-text-secondary">User/Day Alerts (&gt;20%)</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{repeatAnalysis.userDailyAlerts.length}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-interactive p-3">
          <p className="text-xs uppercase tracking-wider text-text-secondary">Tracked Commits ({range})</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{committedEventsCount}</p>
          <p className="mt-1 text-xs text-text-secondary">{committedSessionCount} unique sessions</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-interactive p-3">
          <p className="text-xs uppercase tracking-wider text-text-secondary">Transfer Score v0</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{formatPercent(transferScoreV0.transferScore)}</p>
          <p className={`mt-1 text-xs font-medium uppercase tracking-[0.1em] ${transferStatusClass(transferScoreV0.status)}`}>
            {transferScoreV0.status}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-lg border border-border-subtle bg-surface-interactive p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">AI Policy Health</h2>
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-border-subtle border-l-2 border-l-emerald-700/60 bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-secondary">Decision Coverage Rate</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{formatPercent(policyCoverageRate)}</p>
            <p className="mt-1 text-xs text-text-secondary">{policyCoverageCount}/{quality.committedRowsCount} committed events</p>
          </div>
          <div className={`rounded-lg border border-border-subtle border-l-2 bg-surface p-3 ${policyFallbackRate > 0.5 ? 'border-l-red-700/70' : policyFallbackRate > 0.3 ? 'border-l-amber-700/70' : 'border-l-emerald-700/60'}`}>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Fallback Rate</p>
            <p className={`mt-1 text-xl font-semibold ${policyFallbackRate > 0.5 ? 'text-red-300' : policyFallbackRate > 0.3 ? 'text-amber-300' : 'text-emerald-300'}`}>
              {formatPercent(policyFallbackRate)}
            </p>
            <p className="mt-1 text-xs text-text-secondary">{policyFallbackCount}/{policyDecisionCount} policy decisions</p>
          </div>
          <div className={`rounded-lg border border-border-subtle border-l-2 bg-surface p-3 ${policyParseFailureRate > 0 ? 'border-l-red-700/70' : 'border-l-emerald-700/60'}`}>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Parse/Validation Failures</p>
            <p className={`mt-1 text-xl font-semibold ${policyParseFailureRate === 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatPercent(policyParseFailureRate)}
            </p>
            <p className="mt-1 text-xs text-text-secondary">{policyParseFailureCount}/{policyDecisionCount} policy decisions</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-secondary">Policy Decisions Logged</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{policyDecisionCount}</p>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-secondary">AI vs Baseline Finalize Delta</p>
            <p className={`mt-1 text-xl font-semibold ${finalizeRateDelta === null ? 'text-text-muted' : finalizeRateDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {finalizeRateDelta === null ? '-' : formatPercent(finalizeRateDelta)}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-secondary">AI vs Baseline Transfer Delta</p>
            <p className={`mt-1 text-xl font-semibold ${transferScoreDelta === null ? 'text-text-muted' : transferScoreDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {transferScoreDelta === null ? '-' : formatPercent(transferScoreDelta)}
            </p>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-secondary">Sample Ratio</p>
            <p className={`mt-1 text-xl font-semibold ${sampleRatioMismatch ? 'text-red-300' : 'text-emerald-300'}`}>
              {assignedEligibleTotal < 20 ? 'insufficient' : sampleRatioMismatch ? 'mismatch' : 'healthy'}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-secondary">Missing Attribution</p>
            <p className={`mt-1 text-xl font-semibold ${missingCohortAttributionRate <= 0.05 ? 'text-emerald-300' : 'text-amber-300'}`}>
              {formatPercent(missingCohortAttributionRate)}
            </p>
            <p className="mt-1 text-xs text-text-secondary">{quality.committedRowsCount - committedWithKnownCohort}/{quality.committedRowsCount} events missing cohort</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-secondary">Eligible But Unassigned</p>
            <p className={`mt-1 text-xl font-semibold ${eligibleButUnassignedRate <= 0.02 ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatPercent(eligibleButUnassignedRate)}
            </p>
            <p className="mt-1 text-xs text-text-secondary">{eligibleCommittedRowsCount - eligibleAssignedRowsCount}/{eligibleCommittedRowsCount} eligible events</p>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr><th className="py-2">Decision Scope</th><th className="py-2">p95 Latency</th><th className="py-2">Samples</th></tr>
            </thead>
            <tbody>
              {policyLatencyByScope.map((row) => (
                <tr key={row.scope} className="border-t border-border-subtle">
                  <td className="py-2 text-text-secondary">{row.scope}</td>
                  <td className="py-2 text-text-primary">{row.p95LatencyMs === null ? '-' : `${row.p95LatencyMs} ms`}</td>
                  <td className="py-2 text-text-primary">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Operator Next Actions</h2>
          <span className="text-xs text-text-muted">Prioritized across onboarding, personalization, transfer, friction, and AI override quality.</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {operatorActions.slice(0, 6).map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="rounded-lg border border-border-subtle bg-surface p-3 hover:border-border-interactive"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">{action.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wider ${action.priority === 'high' ? 'bg-red-900/40 text-red-300' : action.priority === 'medium' ? 'bg-amber-900/40 text-amber-300' : 'bg-blue-900/40 text-blue-300'}`}>
                  {action.priority}
                </span>
              </div>
              <p className="text-xs text-text-secondary">{action.rationale}</p>
              <p className="mt-2 text-xs text-text-muted">{action.recommendation}</p>
              </Link>
            ))}
          </div>
        </section>

      <section className="mb-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Personalization Scope A/B</h2>
          <span className="text-xs text-text-muted">Comparing launch→finalize and transfer quality by cohort.</span>
        </div>
        <p className="mb-4 text-xs text-text-muted">
          Rollback path: disable <code className="rounded bg-surface px-1 py-0.5">personalization_scope_experiment</code> to return all users to baseline scope immediately.
        </p>

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Finalize Rate Delta (treatment - control)</p>
            <p className={`mt-1 text-xl font-semibold ${finalizeRateDelta === null ? 'text-text-primary' : finalizeRateDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {finalizeRateDelta === null ? '-' : formatPercent(finalizeRateDelta)}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Transfer Score Delta (treatment - control)</p>
            <p className={`mt-1 text-xl font-semibold ${transferScoreDelta === null ? 'text-text-primary' : transferScoreDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {transferScoreDelta === null ? '-' : formatPercent(transferScoreDelta)}
            </p>
          </div>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Missing Cohort Attribution</p>
            <p className={`mt-1 text-xl font-semibold ${missingCohortAttributionRate <= 0.05 ? 'text-emerald-300' : 'text-amber-300'}`}>
              {formatPercent(missingCohortAttributionRate)}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Eligible But Unassigned</p>
            <p className={`mt-1 text-xl font-semibold ${eligibleButUnassignedRate <= 0.02 ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatPercent(eligibleButUnassignedRate)}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Sample Ratio Check</p>
            <p className={`mt-1 text-xl font-semibold ${sampleRatioMismatch ? 'text-red-300' : 'text-emerald-300'}`}>
              {assignedEligibleTotal < 20 ? 'insufficient' : sampleRatioMismatch ? 'mismatch' : 'healthy'}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              treatment share {assignedEligibleTotal > 0 ? formatPercent(treatmentShare) : '-'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Launch → Finalize Funnel by Cohort</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr><th className="py-2">Cohort</th><th className="py-2">Committed</th><th className="py-2">Finalized</th><th className="py-2">Finalize Rate</th></tr>
                </thead>
                <tbody>
                  {cohortFunnelRows.map((row) => (
                    <tr key={row.cohort} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.cohort}</td>
                      <td className="py-2 text-text-primary">{row.committedCount}</td>
                      <td className="py-2 text-text-primary">{row.finalizedCount}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.finalizedRate)}</td>
                    </tr>
                  ))}
                  {cohortFunnelRows.length === 0 && (
                    <tr className="border-t border-border-subtle">
                      <td className="py-3 text-text-muted" colSpan={4}>No cohort-attributed sessions in this window yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Transfer Score by Cohort</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr><th className="py-2">Cohort</th><th className="py-2">Committed</th><th className="py-2">Transfer Score</th><th className="py-2">Status</th></tr>
                </thead>
                <tbody>
                  {cohortTransferRows.map((row) => (
                    <tr key={row.cohort} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.cohort}</td>
                      <td className="py-2 text-text-primary">{row.committedCount}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.transfer.transferScore)}</td>
                      <td className={`py-2 font-medium uppercase tracking-[0.08em] ${transferStatusClass(row.transfer.status)}`}>
                        {row.transfer.status}
                      </td>
                    </tr>
                  ))}
                  {cohortTransferRows.length === 0 && (
                    <tr className="border-t border-border-subtle">
                      <td className="py-3 text-text-muted" colSpan={4}>Not enough cohort data for transfer comparison yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Personalization Loop (Silent)</h2>
          <span className="text-xs text-text-muted">Telemetry event: personalization_profile_scored</span>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Profile Snapshots</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{personalizationInsights.total}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Average Score</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {personalizationInsights.averageScore === null ? '-' : personalizationInsights.averageScore.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Fragile + At-Risk Share</p>
            <p className="mt-1 text-xl font-semibold text-amber-300">{formatPercent(personalizationInsights.atRiskShare)}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Coverage vs committed user-days</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{formatPercent(personalizationCoverage)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Segment Distribution</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr><th className="py-2">Segment</th><th className="py-2">Count</th><th className="py-2">Share</th></tr>
                </thead>
                <tbody>
                  {personalizationInsights.segmentDistribution.map((row) => (
                    <tr key={row.segment} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.segment}</td>
                      <td className="py-2 text-text-primary">{row.count}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                    </tr>
                  ))}
                  {personalizationInsights.segmentDistribution.length === 0 && (
                    <tr className="border-t border-border-subtle">
                      <td className="py-3 text-text-muted" colSpan={3}>No personalization snapshots in this window yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Recommendation Mix</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr><th className="py-2">Recommendation</th><th className="py-2">Count</th><th className="py-2">Share</th></tr>
                </thead>
                <tbody>
                  {personalizationInsights.recommendationDistribution.map((row) => (
                    <tr key={row.recommendation} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.recommendation}</td>
                      <td className="py-2 text-text-primary">{row.count}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                    </tr>
                  ))}
                  {personalizationInsights.recommendationDistribution.length === 0 && (
                    <tr className="border-t border-border-subtle">
                      <td className="py-3 text-text-muted" colSpan={3}>No recommendation mix available yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Transfer Score v0</h2>
          <span className={`text-xs font-medium uppercase tracking-[0.12em] ${transferStatusClass(transferScoreV0.status)}`}>
            Decision: {transferScoreV0.status}
          </span>
        </div>
        <p className="mb-4 text-sm text-text-secondary">
          Composite of next-day continuation quality, proof coverage, and repeat failure loop control.
        </p>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Quality-Adjusted Completion</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{formatPercent(transferScoreV0.qualityAdjustedCompletion)}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Next-Day Continuation</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{formatPercent(transferScoreV0.nextDayContinuationQuality)}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Proof Coverage</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{formatPercent(transferScoreV0.proofCoverage)}</p>
          </div>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Repeat Failure Loop Rate</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{formatPercent(transferScoreV0.repeatFailureLoopRate)}</p>
            <p className="mt-1 text-xs text-text-muted">Blocked events: {transferScoreV0.blockedEventCount}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Finalized / Committed</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {transferScoreV0.finalizedSessions}/{transferScoreV0.committedSessions}
            </p>
            <p className="mt-1 text-xs text-text-muted">{formatPercent(transferScoreV0.finalizedRate)} finalized rate</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Current Decision Rationale</p>
            <ul className="mt-1 space-y-1 text-xs text-text-secondary">
              {transferScoreV0.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Promotion / Rollback Thresholds</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr><th className="py-2">Rule</th><th className="py-2">Threshold</th></tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">Promote min transfer score</td>
                    <td className="py-2 text-text-primary">{formatPercent(transferScoreV0.thresholds.promoteMinScore)}</td>
                  </tr>
                  <tr className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">Promote min proof coverage</td>
                    <td className="py-2 text-text-primary">{formatPercent(transferScoreV0.thresholds.promoteMinProofCoverage)}</td>
                  </tr>
                  <tr className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">Promote max repeat loop rate</td>
                    <td className="py-2 text-text-primary">{formatPercent(transferScoreV0.thresholds.promoteMaxRepeatFailureLoopRate)}</td>
                  </tr>
                  <tr className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">Rollback max transfer score</td>
                    <td className="py-2 text-text-primary">{formatPercent(transferScoreV0.thresholds.rollbackMaxScore)}</td>
                  </tr>
                  <tr className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">Rollback min proof coverage</td>
                    <td className="py-2 text-text-primary">{formatPercent(transferScoreV0.thresholds.rollbackMinProofCoverage)}</td>
                  </tr>
                  <tr className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">Rollback min repeat loop rate</td>
                    <td className="py-2 text-text-primary">{formatPercent(transferScoreV0.thresholds.rollbackMinRepeatFailureLoopRate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Top Repeated Failure Questions</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr><th className="py-2">Question</th><th className="py-2">Repeated Users</th><th className="py-2">Repeat Rate</th></tr>
                </thead>
                <tbody>
                  {transferScoreV0.topRepeatedFailureQuestions.map((row) => (
                    <tr key={row.questionId} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.questionId}</td>
                      <td className="py-2 text-text-primary">{row.repeatedUsers}/{row.totalUsers}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.repeatRate)}</td>
                    </tr>
                  ))}
                  {transferScoreV0.topRepeatedFailureQuestions.length === 0 && (
                    <tr className="border-t border-border-subtle">
                      <td className="py-3 text-text-muted" colSpan={3}>No repeated blocked-practice loops in this window.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Daily Repeat Rate</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-text-muted"><tr><th className="py-2">Date</th><th className="py-2">Rate</th><th className="py-2">Repeated/Total</th></tr></thead>
              <tbody>
                {repeatAnalysis.daily.slice(0, 14).map((row) => (
                  <tr key={row.date} className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">{row.date}</td>
                    <td className="py-2 text-text-primary">{formatPercent(row.repeatRate)}</td>
                    <td className="py-2 text-text-secondary">{row.repeatedCommitted}/{row.totalCommitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Top Repeated First Items</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-text-muted"><tr><th className="py-2">Href</th><th className="py-2">Rate</th><th className="py-2">Repeated/Total</th></tr></thead>
              <tbody>
                {repeatedItems.map((row) => (
                  <tr key={row.href} className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">{row.href}</td>
                    <td className="py-2 text-text-primary">{formatPercent(row.repeatRate)}</td>
                    <td className="py-2 text-text-secondary">{row.repeatedCount}/{row.totalCommitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Completion Funnel by First Item</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted"><tr><th className="py-2">First Item</th><th className="py-2">Committed</th><th className="py-2">Completed</th><th className="py-2">Finalized</th></tr></thead>
            <tbody>
              {funnel.map((row) => (
                <tr key={row.href} className="border-t border-border-subtle">
                  <td className="py-2 text-text-secondary">{row.href}</td>
                  <td className="py-2 text-text-primary">{row.committedSessions}</td>
                  <td className="py-2 text-text-primary">{row.completedFirstItemSessions}</td>
                  <td className="py-2 text-text-primary">{row.finalizedSessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">Onboarding First-Win Funnel</h2>
          <span className="text-xs text-text-muted">Telemetry track: onboarding</span>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Shown</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{onboardingShownCount}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Goal Selected</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {onboardingGoalCount} <span className="text-sm text-text-secondary">({formatPercent(onboardingGoalConversion)})</span>
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Plan Generated</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {onboardingPlanCount} <span className="text-sm text-text-secondary">({formatPercent(onboardingPlanConversion)})</span>
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Launched</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {onboardingLaunchCount} <span className="text-sm text-text-secondary">({formatPercent(onboardingLaunchConversion)})</span>
            </p>
          </div>
        </div>

        <div className="mb-6 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr>
                <th className="py-2">Stage</th>
                <th className="py-2">Unique Sessions</th>
                <th className="py-2">Conv. from Shown</th>
                <th className="py-2">Drop-off from Previous</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border-subtle">
                <td className="py-2 text-text-secondary">Shown</td>
                <td className="py-2 text-text-primary">{onboardingShownCount}</td>
                <td className="py-2 text-text-primary">100.0%</td>
                <td className="py-2 text-text-secondary">-</td>
              </tr>
              <tr className="border-t border-border-subtle">
                <td className="py-2 text-text-secondary">Goal selected</td>
                <td className="py-2 text-text-primary">{onboardingGoalCount}</td>
                <td className="py-2 text-text-primary">{formatPercent(onboardingGoalConversion)}</td>
                <td className="py-2 text-text-secondary">{onboardingDropAfterShown}</td>
              </tr>
              <tr className="border-t border-border-subtle">
                <td className="py-2 text-text-secondary">Plan generated</td>
                <td className="py-2 text-text-primary">{onboardingPlanCount}</td>
                <td className="py-2 text-text-primary">{formatPercent(onboardingPlanConversion)}</td>
                <td className="py-2 text-text-secondary">{onboardingDropAfterGoal}</td>
              </tr>
              <tr className="border-t border-border-subtle">
                <td className="py-2 text-text-secondary">Launched</td>
                <td className="py-2 text-text-primary">{onboardingLaunchCount}</td>
                <td className="py-2 text-text-primary">{formatPercent(onboardingLaunchConversion)}</td>
                <td className="py-2 text-text-secondary">{onboardingDropAfterPlan}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Goal Selection Mix</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr><th className="py-2">Goal</th><th className="py-2">Sessions</th><th className="py-2">Share</th></tr>
                </thead>
                <tbody>
                  {goalBreakdown.map((row) => (
                    <tr key={row.goal} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.goal}</td>
                      <td className="py-2 text-text-primary">{row.sessions}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                    </tr>
                  ))}
                  {goalBreakdown.length === 0 && (
                    <tr className="border-t border-border-subtle">
                      <td className="py-3 text-text-muted" colSpan={3}>No goal selection events in this window.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">Launch Target Paths</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr><th className="py-2">Path</th><th className="py-2">Sessions</th><th className="py-2">Share</th></tr>
                </thead>
                <tbody>
                  {launchPathBreakdown.map((row) => (
                    <tr key={row.targetPath} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.targetPath}</td>
                      <td className="py-2 text-text-primary">{row.sessions}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                    </tr>
                  ))}
                  {launchPathBreakdown.length === 0 && (
                    <tr className="border-t border-border-subtle">
                      <td className="py-3 text-text-muted" colSpan={3}>No launch events in this window.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
