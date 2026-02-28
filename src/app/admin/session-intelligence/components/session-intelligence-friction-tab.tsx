import Link from 'next/link';
import { buildLink, RANGE_DAYS, TRIAGE_STATUSES } from '../params';
import { buildUserKey, stateBadgeClass, triageBadgeClass } from '../utils';
import { adjudicateAIDecision, autoTriageTopQueue, generateAIBrief, recommendAndApplyAITriage, saveFrictionTriage } from '../actions';
import {
  type AIDecisionModeKey,
  type AIDecisionOutcomeKey,
  type AIDecisionSourceKey,
  type AIDecisionTypeKey,
  type FrictionRowSet,
  type QueueOwnerKey,
  type QueueStatusKey,
  type RangeKey,
  type TrackKey,
} from '../types';
import { AUTO_TRIAGE_MINUTES_COOLDOWN, displayTrackLabel } from '../params';
import { normalizeTelemetryHref } from '@/lib/session-recommendation-quality';

type SessionIntelligenceFrictionTabProps = {
  range: RangeKey;
  track: TrackKey;
  queueStatus: QueueStatusKey;
  queueOwner: QueueOwnerKey;
  aiType: AIDecisionTypeKey;
  aiMode: AIDecisionModeKey;
  aiSource: AIDecisionSourceKey;
  aiOutcome: AIDecisionOutcomeKey;
  autoTriageEnabled: boolean;
  friction: FrictionRowSet;
};

export function SessionIntelligenceFrictionTab({
  range,
  track,
  queueStatus,
  queueOwner,
  aiType,
  aiMode,
  aiSource,
  aiOutcome,
  autoTriageEnabled,
  friction,
}: SessionIntelligenceFrictionTabProps) {
  const {
    frictionMetrics,
    hotspotsWithTriage,
    triageQueueRows,
    autoTriageEligibleRows,
    queueOwnerOptions,
    focusedTriage,
    frictionDrilldown,
    frictionTriageAuditRows,
    aiReplaySummary,
    aiAssistGroup,
    aiAutoGroup,
  } = friction;
  const focusTrack = friction.focusTrack;
  const focusStep = friction.focusStep;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">Total Snapshots ({range})</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{frictionMetrics.totalSnapshots}</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">Latest Daily Stuck Share</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {frictionMetrics.dailyStuck[0] ? `${(frictionMetrics.dailyStuck[0].stuckRate * 100).toFixed(1)}%` : '0.0%'}
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">Daily Alerts ({'>'}30% stuck)</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{frictionMetrics.dailyAlerts.length}</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <p className="text-xs uppercase tracking-wider text-text-muted">Open Hotspots</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">
            {hotspotsWithTriage.filter((row) => row.status !== 'resolved').length}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text-primary">AI Decision Replay</h2>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href={`/api/admin/session-intelligence/ai-replay?days=${RANGE_DAYS[range]}&decisionType=${aiType}&decisionMode=${aiMode}&source=${aiSource}&reviewOutcome=${aiOutcome}`}
              className="text-cyan-300 hover:text-cyan-200"
            >
              Open JSON
            </Link>
            <Link
              href={`/api/admin/session-intelligence/ai-replay?format=csv&days=${RANGE_DAYS[range]}&decisionType=${aiType}&decisionMode=${aiMode}&source=${aiSource}&reviewOutcome=${aiOutcome}`}
              className="text-cyan-300 hover:text-cyan-200"
            >
              Open CSV
            </Link>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(['all', 'triage_brief', 'triage_recommendation', 'session_plan', 'scope_policy', 'onboarding_path'] as AIDecisionTypeKey[]).map((option) => (
            <Link
              key={`aiType:${option}`}
              href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType: option, aiMode, aiSource, aiOutcome })}
              className={`rounded-full border px-3 py-1 text-xs ${aiType === option ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
            >
              type: {option}
            </Link>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(['all', 'assist', 'auto', 'suggest'] as AIDecisionModeKey[]).map((option) => (
            <Link
              key={`aiMode:${option}`}
              href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode: option, aiSource, aiOutcome })}
              className={`rounded-full border px-3 py-1 text-xs ${aiMode === option ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
            >
              mode: {option}
            </Link>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['all', 'session_intelligence', 'ai_recommendation', 'ai_auto_batch', 'ai_policy'] as AIDecisionSourceKey[]).map((option) => (
            <Link
              key={`aiSource:${option}`}
              href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode, aiSource: option, aiOutcome })}
              className={`rounded-full border px-3 py-1 text-xs ${aiSource === option ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
            >
              source: {option}
            </Link>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['all', 'confirmed', 'overridden', 'inconclusive', 'unreviewed'] as AIDecisionOutcomeKey[]).map((option) => (
            <Link
              key={`aiOutcome:${option}`}
              href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome: option })}
              className={`rounded-full border px-3 py-1 text-xs ${aiOutcome === option ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
            >
              outcome: {option}
            </Link>
          ))}
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Decisions Logged ({range})</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{aiReplaySummary.totalDecisions}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Assist Override Rate</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {aiAssistGroup ? `${(aiAssistGroup.overrideRate * 100).toFixed(1)}%` : '0.0%'}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Auto Override Rate</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {aiAutoGroup ? `${(aiAutoGroup.overrideRate * 100).toFixed(1)}%` : '0.0%'}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Average Confidence</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {aiReplaySummary.confidence.average === null ? '-' : aiReplaySummary.confidence.average.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Confirmed</p>
            <p className="mt-1 text-xl font-semibold text-emerald-300">{`${(aiReplaySummary.outcomes.confirmedRate * 100).toFixed(1)}%`}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Overridden</p>
            <p className="mt-1 text-xl font-semibold text-amber-300">{`${(aiReplaySummary.outcomes.overriddenRate * 100).toFixed(1)}%`}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Unreviewed</p>
            <p className="mt-1 text-xl font-semibold text-blue-300">{`${(aiReplaySummary.outcomes.unreviewedRate * 100).toFixed(1)}%`}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Inconclusive</p>
            <p className="mt-1 text-xl font-semibold text-sky-300">{`${(aiReplaySummary.outcomes.inconclusiveRate * 100).toFixed(1)}%`}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Review Latency (p50/p90 min)</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {aiReplaySummary.reviewLatency.p50Minutes === null || aiReplaySummary.reviewLatency.p90Minutes === null
                ? '-'
                : `${Math.round(aiReplaySummary.reviewLatency.p50Minutes)}/${Math.round(aiReplaySummary.reviewLatency.p90Minutes)}`}
            </p>
          </div>
        </div>
        <p className="mb-4 text-xs text-text-muted">
          Confidence bins: high {aiReplaySummary.confidence.high}, medium {aiReplaySummary.confidence.medium}, low {aiReplaySummary.confidence.low}, unknown {aiReplaySummary.confidence.unknown}
        </p>
        {aiReplaySummary.insights.length > 0 && (
          <div className="mb-4 rounded-lg border border-border-subtle bg-surface p-3">
            <p className="mb-2 text-xs uppercase tracking-wider text-text-muted">Actionable Insights</p>
            <ul className="space-y-2 text-sm">
              {aiReplaySummary.insights.map((insight) => (
                <li key={insight.id} className="text-text-secondary">
                  <span className={`mr-2 rounded-full px-2 py-0.5 text-xs ${insight.severity === 'critical' ? 'bg-red-900/40 text-red-300' : insight.severity === 'warning' ? 'bg-amber-900/40 text-amber-300' : 'bg-blue-900/40 text-blue-300'}`}>
                    {insight.severity}
                  </span>
                  <span className="text-text-primary">{insight.title}:</span> {insight.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr>
                <th className="py-2">Type</th>
                <th className="py-2">Mode</th>
                <th className="py-2">Total</th>
                <th className="py-2">Overrides</th>
                <th className="py-2">Override Rate</th>
              </tr>
            </thead>
            <tbody>
              {aiReplaySummary.groups.map((group) => (
                <tr key={`${group.decisionType}:${group.decisionMode}`} className="border-t border-border-subtle">
                  <td className="py-2 text-text-secondary">{group.decisionType}</td>
                  <td className="py-2 text-text-secondary">{group.decisionMode}</td>
                  <td className="py-2 text-text-primary">{group.total}</td>
                  <td className="py-2 text-text-secondary">{group.overrides}</td>
                  <td className="py-2 text-text-primary">{`${(group.overrideRate * 100).toFixed(1)}%`}</td>
                </tr>
              ))}
              {aiReplaySummary.groups.length === 0 && (
                <tr className="border-t border-border-subtle">
                  <td className="py-3 text-text-muted" colSpan={5}>No AI decisions in this window yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr>
                <th className="py-2">Source</th>
                <th className="py-2">Total</th>
                <th className="py-2">Overrides</th>
                <th className="py-2">Override Rate</th>
              </tr>
            </thead>
            <tbody>
              {aiReplaySummary.sources.map((row) => (
                <tr key={row.source} className="border-t border-border-subtle">
                  <td className="py-2 text-text-secondary">{row.source}</td>
                  <td className="py-2 text-text-primary">{row.total}</td>
                  <td className="py-2 text-text-secondary">{row.overrides}</td>
                  <td className="py-2 text-text-primary">{`${(row.overrideRate * 100).toFixed(1)}%`}</td>
                </tr>
              ))}
              {aiReplaySummary.sources.length === 0 && (
                <tr className="border-t border-border-subtle">
                  <td className="py-3 text-text-muted" colSpan={4}>No source-level data in this window.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr>
                <th className="py-2">Hotspot</th>
                <th className="py-2">Total</th>
                <th className="py-2">Overrides</th>
                <th className="py-2">Override Rate</th>
              </tr>
            </thead>
            <tbody>
              {aiReplaySummary.hotspots.slice(0, 10).map((row) => (
                <tr key={`${row.trackSlug}:${row.stepIndex}`} className="border-t border-border-subtle">
                  <td className="py-2 text-text-secondary">{`${row.trackSlug}:${row.stepIndex}`}</td>
                  <td className="py-2 text-text-primary">{row.total}</td>
                  <td className="py-2 text-text-secondary">{row.overrides}</td>
                  <td className="py-2 text-text-primary">{`${(row.overrideRate * 100).toFixed(1)}%`}</td>
                </tr>
              ))}
              {aiReplaySummary.hotspots.length === 0 && (
                <tr className="border-t border-border-subtle">
                  <td className="py-3 text-text-muted" colSpan={4}>No hotspot-level data in this window.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr>
                <th className="py-2">Confidence Bucket</th>
                <th className="py-2">Total</th>
                <th className="py-2">Overrides</th>
                <th className="py-2">Override Rate</th>
              </tr>
            </thead>
            <tbody>
              {aiReplaySummary.calibration.map((row) => (
                <tr key={row.bucket} className="border-t border-border-subtle">
                  <td className="py-2 text-text-secondary">{row.bucket}</td>
                  <td className="py-2 text-text-primary">{row.total}</td>
                  <td className="py-2 text-text-secondary">{row.overrides}</td>
                  <td className="py-2 text-text-primary">{`${(row.overrideRate * 100).toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr>
                <th className="py-2">Time</th>
                <th className="py-2">Type</th>
                <th className="py-2">Mode</th>
                <th className="py-2">Hotspot</th>
                <th className="py-2">Confidence</th>
                <th className="py-2">Outcome</th>
                <th className="py-2">First Review (min)</th>
                <th className="py-2">Adjudicate</th>
              </tr>
            </thead>
            <tbody>
              {aiReplaySummary.recent.map((row) => (
                <tr key={`${row.createdAt}:${row.trackSlug}:${row.stepIndex}:${row.decisionType}`} className="border-t border-border-subtle">
                  <td className="py-2 text-text-secondary">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="py-2 text-text-secondary">{row.decisionType}</td>
                  <td className="py-2 text-text-secondary">{row.decisionMode}</td>
                  <td className="py-2 text-text-secondary">{`${row.trackSlug}:${row.stepIndex}`}</td>
                  <td className="py-2 text-text-primary">{row.confidence === null ? '-' : row.confidence.toFixed(2)}</td>
                  <td className={`py-2 font-medium ${row.reviewOutcome === 'overridden' ? 'text-amber-300' : row.reviewOutcome === 'confirmed' ? 'text-emerald-300' : row.reviewOutcome === 'inconclusive' ? 'text-sky-300' : 'text-blue-300'}`}>
                    {row.reviewOutcome}
                  </td>
                  <td className="py-2 text-text-secondary">{row.minutesToFirstManualUpdate === null ? '-' : row.minutesToFirstManualUpdate.toFixed(1)}</td>
                  <td className="py-2">
                    <form action={adjudicateAIDecision} className="flex flex-wrap items-center gap-1">
                      <input type="hidden" name="decisionId" value={row.id} />
                      <select
                        name="label"
                        defaultValue={row.reviewLabel ?? 'confirmed'}
                        className="rounded border border-border-subtle bg-surface px-2 py-1 text-xs text-text-primary"
                      >
                        <option value="confirmed">confirmed</option>
                        <option value="overridden">overridden</option>
                        <option value="inconclusive">inconclusive</option>
                      </select>
                      <input
                        name="notes"
                        defaultValue={row.reviewNotes ?? ''}
                        placeholder="optional note"
                        className="w-40 rounded border border-border-subtle bg-surface px-2 py-1 text-xs text-text-primary placeholder:text-text-muted"
                      />
                      <button
                        type="submit"
                        className="rounded border border-border-interactive px-2 py-1 text-xs text-text-primary hover:bg-surface"
                      >
                        Save
                      </button>
                    </form>
                    {(row.reviewedBy || row.reviewedAt) && (
                      <p className="mt-1 text-[11px] text-text-muted">
                        {row.reviewedBy || 'admin'} {row.reviewedAt ? `at ${new Date(row.reviewedAt).toLocaleString()}` : ''}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
              {aiReplaySummary.recent.length === 0 && (
                <tr className="border-t border-border-subtle">
                  <td className="py-3 text-text-muted" colSpan={8}>No recent decisions to replay.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-border-subtle bg-surface-interactive p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Triage Queue</h2>
          <p className="text-xs text-text-secondary">Sorted by risk score (stuck share * sample size)</p>
        </div>

        <form action={autoTriageTopQueue} className="mb-3">
          <input
            type="hidden"
            name="targets"
            value={JSON.stringify(
              autoTriageEligibleRows.slice(0, 5).map((row) => ({
                trackSlug: row.trackSlug,
                stepIndex: row.stepIndex,
              }))
            )}
          />
          <input type="hidden" name="lookbackDays" value={RANGE_DAYS[range]} />
          <button
            type="submit"
            className="rounded-md border border-emerald-700/60 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!autoTriageEnabled || autoTriageEligibleRows.length === 0}
          >
            AI Auto-triage Top 5 Eligible
          </button>
          <span className="ml-2 text-xs text-text-secondary">
            {autoTriageEnabled
              ? `Eligible: ${autoTriageEligibleRows.length} (cooldown ${AUTO_TRIAGE_MINUTES_COOLDOWN}m)`
              : 'Auto-triage disabled by feature flag'}
          </span>
        </form>

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-border-subtle bg-surface p-1.5">
          {(['open', 'all', 'new', 'investigating', 'resolved'] as QueueStatusKey[]).map((status) => (
            <Link
              key={status}
              href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus: status, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
              className={`rounded px-2.5 py-1 text-xs ${queueStatus === status ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {status}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px bg-border-subtle" />
          <Link
            href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner: 'all', aiType, aiMode, aiSource, aiOutcome })}
            className={`rounded px-2.5 py-1 text-xs ${queueOwner === 'all' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            all owners
          </Link>
          <Link
            href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner: 'unassigned', aiType, aiMode, aiSource, aiOutcome })}
            className={`rounded px-2.5 py-1 text-xs ${queueOwner === 'unassigned' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            unassigned
          </Link>
          {queueOwnerOptions.map((owner) => (
            <Link
              key={owner}
              href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner: owner, aiType, aiMode, aiSource, aiOutcome })}
              className={`rounded px-2.5 py-1 text-xs ${queueOwner === owner ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {owner}
            </Link>
          ))}
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted"><tr><th className="py-2">Track</th><th className="py-2">Step</th><th className="py-2">Status</th><th className="py-2">Owner</th><th className="py-2">Risk</th><th className="py-2">Stuck Share</th><th className="py-2">Samples</th><th className="py-2">Inspect</th></tr></thead>
            <tbody>
              {triageQueueRows.slice(0, 30).map((row) => (
                <tr key={`queue:${row.trackSlug}:${row.stepIndex}`} className="border-t border-border-subtle">
                  <td className="py-2 text-text-secondary">{row.trackSlug}</td>
                  <td className="py-2 text-text-secondary">{row.stepIndex}</td>
                  <td className={`py-2 font-medium ${triageBadgeClass(row.status)}`}>{row.status}</td>
                  <td className="py-2 text-text-secondary">{row.owner || 'unassigned'}</td>
                  <td className={`py-2 font-medium ${row.riskScore >= 0.7 ? 'text-red-300' : row.riskScore >= 0.35 ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {row.riskScore.toFixed(2)}
                  </td>
                  <td className="py-2 text-text-secondary">{`${(row.stuckRate * 100).toFixed(1)}%`}</td>
                  <td className="py-2 text-text-secondary">{row.total}</td>
                  <td className="py-2">
                    <Link
                      href={buildLink({
                        tab: 'friction',
                        range,
                        track,
                        focusTrack: row.trackSlug,
                        focusStep: row.stepIndex,
                        queueStatus,
                        queueOwner,
                        aiType,
                        aiMode,
                        aiSource,
                        aiOutcome,
                      })}
                      className="text-xs text-cyan-300 hover:text-cyan-200"
                    >
                      View sessions
                    </Link>
                  </td>
                </tr>
              ))}
              {triageQueueRows.length === 0 && (
                <tr className="border-t border-border-subtle">
                  <td className="py-3 text-text-muted" colSpan={8}>No hotspots match this queue filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border-subtle bg-surface-interactive p-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">State Distribution</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-text-muted"><tr><th className="py-2">State</th><th className="py-2">Share</th><th className="py-2">Count</th></tr></thead>
              <tbody>
                {frictionMetrics.stateDistribution.map((row) => (
                  <tr key={row.state} className="border-t border-border-subtle">
                    <td className={`py-2 font-medium ${stateBadgeClass(row.state)}`}>{row.state}</td>
                    <td className="py-2 text-text-primary">{`${(row.share * 100).toFixed(1)}%`}</td>
                    <td className="py-2 text-text-secondary">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-border-subtle bg-surface-interactive p-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Trigger Split</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-text-muted"><tr><th className="py-2">Trigger</th><th className="py-2">Share</th><th className="py-2">Count</th></tr></thead>
              <tbody>
                {frictionMetrics.triggerDistribution.map((row) => (
                  <tr key={row.trigger} className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">{row.trigger}</td>
                    <td className="py-2 text-text-primary">{`${(row.share * 100).toFixed(1)}%`}</td>
                    <td className="py-2 text-text-secondary">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-lg border border-border-subtle bg-surface-interactive p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Top Stuck Hotspots</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted"><tr><th className="py-2">Track</th><th className="py-2">Step</th><th className="py-2">Status</th><th className="py-2">Stuck Share</th><th className="py-2">Stuck/Total</th><th className="py-2">Inspect</th></tr></thead>
            <tbody>
              {hotspotsWithTriage.slice(0, 20).map((row) => (
                <tr key={`${row.trackSlug}:${row.stepIndex}`} className="border-t border-border-subtle">
                  <td className="py-2 text-text-secondary">{row.trackSlug}</td>
                  <td className="py-2 text-text-secondary">{row.stepIndex}</td>
                  <td className={`py-2 font-medium ${triageBadgeClass(row.status)}`}>{row.status}</td>
                  <td className={`py-2 font-medium ${row.stuckRate >= 0.6 ? 'text-red-300' : row.stuckRate >= 0.3 ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {`${(row.stuckRate * 100).toFixed(1)}%`}
                  </td>
                  <td className="py-2 text-text-secondary">{row.stuckCount}/{row.total}</td>
                  <td className="py-2">
                    <Link
                      href={buildLink({
                        tab: 'friction',
                        range,
                        track,
                        focusTrack: row.trackSlug,
                        focusStep: row.stepIndex,
                        queueStatus,
                        queueOwner,
                        aiType,
                        aiMode,
                        aiSource,
                        aiOutcome,
                      })}
                      className="text-xs text-cyan-300 hover:text-cyan-200"
                    >
                      View sessions
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {frictionDrilldown && (
        <section className="mt-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Hotspot Drill-down</h2>
              <p className="text-sm text-text-secondary">
                {displayTrackLabel(frictionDrilldown.snapshots[0]?.trackSlug || focusTrack || 'unknown')}
                {' '}step {frictionDrilldown.snapshots[0]?.stepIndex ?? focusStep}
              </p>
            </div>
            <Link
              href={buildLink({ tab: 'friction', range, track, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
              className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-secondary hover:bg-surface"
            >
              Clear
            </Link>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border-subtle bg-surface p-3">
              <p className="text-xs uppercase tracking-wider text-text-muted">Snapshots</p>
              <p className="mt-1 text-xl font-semibold text-text-primary">{frictionDrilldown.snapshots.length}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-3">
              <p className="text-xs uppercase tracking-wider text-text-muted">Unique Sessions</p>
              <p className="mt-1 text-xl font-semibold text-text-primary">{new Set(frictionDrilldown.snapshots.map((row) => row.sessionId)).size}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-3">
              <p className="text-xs uppercase tracking-wider text-text-muted">Linked Telemetry Events</p>
              <p className="mt-1 text-xl font-semibold text-text-primary">{frictionDrilldown.telemetry.length}</p>
            </div>
          </div>

          <section className="mb-6 rounded-lg border border-border-subtle bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Triage</h3>
            <form action={generateAIBrief} className="mb-3">
              <input type="hidden" name="trackSlug" value={focusTrack ?? ''} />
              <input type="hidden" name="stepIndex" value={String(focusStep ?? '')} />
              <input type="hidden" name="lookbackDays" value={RANGE_DAYS[range]} />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="rounded-full border border-cyan-700/60 bg-cyan-950/30 px-4 py-1.5 text-xs text-cyan-200 hover:bg-cyan-900/40"
                >
                  Generate AI Brief
                </button>
              </div>
            </form>
            <form action={recommendAndApplyAITriage} className="mb-3">
              <input type="hidden" name="trackSlug" value={focusTrack ?? ''} />
              <input type="hidden" name="stepIndex" value={String(focusStep ?? '')} />
              <input type="hidden" name="lookbackDays" value={RANGE_DAYS[range]} />
              <button
                type="submit"
                className="rounded-full border border-emerald-700/60 bg-emerald-950/30 px-4 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900/40"
              >
                AI Recommend Owner + Status
              </button>
            </form>
            <form action={saveFrictionTriage} className="grid gap-3 md:grid-cols-3">
              <input type="hidden" name="trackSlug" value={focusTrack ?? ''} />
              <input type="hidden" name="stepIndex" value={String(focusStep ?? '')} />
              <input type="hidden" name="lookbackDays" value={RANGE_DAYS[range]} />
              <label className="text-xs text-text-muted">
                Status
                <select
                  name="status"
                  defaultValue={focusedTriage?.status ?? 'new'}
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary"
                >
                  {TRIAGE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-text-muted">
                Owner
                <input
                  name="owner"
                  defaultValue={focusedTriage?.owner ?? ''}
                  placeholder="owner name or email"
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                />
              </label>
              <label className="text-xs text-text-muted md:col-span-3">
                Notes
                <textarea
                  name="notes"
                  defaultValue={focusedTriage?.notes ?? ''}
                  rows={3}
                  placeholder="What is happening and next action?"
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                />
              </label>
              <div className="md:col-span-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <button
                  type="submit"
                  className="rounded-full border border-border-interactive bg-surface-interactive px-4 py-1.5 text-text-primary hover:bg-surface"
                >
                  Save triage
                </button>
                {focusedTriage ? (
                  <span>Last updated {new Date(focusedTriage.updated_at).toLocaleString()} by {focusedTriage.updated_by_email}</span>
                ) : (
                  <span>No triage record yet for this hotspot.</span>
                )}
              </div>
            </form>
          </section>

          <section className="mb-6 rounded-lg border border-border-subtle bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Triage Audit Timeline</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr>
                    <th className="py-2">Time</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Actor</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {frictionTriageAuditRows.map((row) => (
                    <tr key={`${row.created_at}:${row.action_type}:${row.actor_email}`} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="py-2 text-text-primary">{row.action_type}</td>
                      <td className="py-2 text-text-secondary">{row.actor_email}</td>
                      <td className="py-2 text-text-secondary">{`${row.before_status || '-'} -> ${row.after_status || '-'}`}</td>
                      <td className="py-2 text-text-secondary">{`${row.before_owner || 'unassigned'} -> ${row.after_owner || 'unassigned'}`}</td>
                    </tr>
                  ))}
                  {frictionTriageAuditRows.length === 0 && (
                    <tr className="border-t border-border-subtle">
                      <td className="py-3 text-text-muted" colSpan={5}>No audit entries yet for this hotspot.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">Recent Friction Snapshots</h3>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted"><tr><th className="py-2">Time</th><th className="py-2">User</th><th className="py-2">Session</th><th className="py-2">State</th><th className="py-2">Trigger</th><th className="py-2">Conf.</th></tr></thead>
                  <tbody>
                    {frictionDrilldown.snapshots.slice(0, 20).map((row) => (
                      <tr key={`${row.sessionId}:${row.createdAt}:${row.trigger}:${row.frictionState}`} className="border-t border-border-subtle">
                        <td className="py-2 text-text-secondary">{new Date(row.createdAt).toLocaleString()}</td>
                        <td className="py-2 text-text-secondary">{buildUserKey(row.email, row.googleId)}</td>
                        <td className="py-2 text-text-secondary">{row.sessionId.slice(0, 10)}...</td>
                        <td className={`py-2 font-medium ${stateBadgeClass(row.frictionState)}`}>{row.frictionState}</td>
                        <td className="py-2 text-text-secondary">{row.trigger}</td>
                        <td className="py-2 text-text-primary">{row.confidence.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">Recent Linked Telemetry</h3>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted"><tr><th className="py-2">Time</th><th className="py-2">Event</th><th className="py-2">Session</th><th className="py-2">Item</th></tr></thead>
                  <tbody>
                    {frictionDrilldown.telemetry.map((row) => {
                      const itemHref = typeof row.payload?.itemHref === 'string'
                        ? normalizeTelemetryHref(row.payload.itemHref)
                        : null;
                      return (
                        <tr key={`${row.session_id}:${row.event_type}:${row.created_at}`} className="border-t border-border-subtle">
                          <td className="py-2 text-text-secondary">{new Date(row.created_at).toLocaleString()}</td>
                          <td className="py-2 text-text-primary">{row.event_type}</td>
                          <td className="py-2 text-text-secondary">{row.session_id.slice(0, 10)}...</td>
                          <td className="py-2 text-text-secondary">{itemHref || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      )}
    </>
  );
}
