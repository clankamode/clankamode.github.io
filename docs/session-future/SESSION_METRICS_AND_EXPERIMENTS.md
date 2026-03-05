# Session Metrics and Experiment Plan

Created: February 15, 2026
Last Updated: March 3, 2026
Status: Active, with operations-first v1 metrics, Transfer Score v0 readout, and triage audit logging

## Measurement Philosophy

Primary objective is **learning transfer**.
Completion and engagement are important, but they are not sufficient.

Metric hierarchy:

1. Transfer metrics (primary).
2. Execution quality metrics (secondary).
3. Operational and guardrail metrics (safety).

## Primary Metrics

### 1. Transfer Score

Composite score from:

1. delayed recall success
2. recurrence of prior failure mode
3. next-day continuation quality
4. proof-of-understanding coverage

Purpose:
- Main optimizer target for adaptive roadmap.

Current implementation status:
- **Transfer Score v0 is active in admin readout** (`/admin/session-intelligence`, quality tab).
- Current v0 formula:
  1. `0.40 * next_day_continuation_quality`
  2. `0.35 * (1 - repeat_failure_loop_rate)`
  3. `0.25 * proof_coverage`
- Current v0 promotion gate:
  1. transfer score >= 0.60
  2. proof coverage >= 0.55
  3. repeat failure loop rate <= 0.30
- Current v0 rollback trigger:
  1. transfer score < 0.45
  2. proof coverage < 0.30
  3. repeat failure loop rate > 0.45

### 2. Repeat Failure Loop Rate

Definition:
- Rate at which users re-enter the same failure pattern within a short horizon.

Target direction:
- Down.

### 3. Quality-Adjusted Completion Rate

Definition:
- Completion events weighted by proof quality signals.

Target direction:
- Up.

## Secondary Metrics

1. Intervention acceptance rate.
2. Intervention efficacy by type.
3. Time-to-complete vs planned duration.
4. Debt paydown rate.
5. Micro-session conversion quality.
6. Triage queue throughput and aging.
7. AI recommendation acceptance and override rates.

## Guardrail Metrics

1. Session abandonment after intervention.
2. Route transition error rate.
3. Duplicate completion events.
4. Finalize failure rate.
5. Execution UI latency and responsiveness.
6. AI triage low-quality resolution rate.

## Operational Metrics v1 (Current Stage)

Scope:

1. Friction silent mode and admin triage operations.
2. No user-facing intervention metrics yet.

Required daily dashboard checks:

1. Friction snapshot insert success rate.
2. Invalid telemetry event rejection count.
3. Friction state distribution sanity by track.
4. Queue open hotspot count and trend.
5. Queue stale hotspot count:
   - unresolved and not updated in 3+ days.

Required weekly review checks:

1. Top 10 hotspot ownership coverage.
2. AI recommendation override rate.
3. Share of hotspots closed without notes.
4. Time from first hotspot to first triage update.

Promotion gates before adaptive interventions:

1. Snapshot pipeline reliability stable for 2 weeks.
2. Queue triage coverage above target threshold.
3. AI recommendation override rate not indicating systematic mismatch.

## Experiment Backlog

## Experiment A: Scope-Down Intervention

Hypothesis:
- Timely scope reduction during drift increases completion quality and lowers abandonment.

Variants:

1. Control: no intervention.
2. Treatment: one `scope_down` offer after drift threshold.

Success metrics:

1. quality-adjusted completion rate
2. abandonment rate (guardrail)

## Experiment B: Debt-Aware Planning

Hypothesis:
- Debt-aware planning reduces repeated failure loops without harming motivation.

Variants:

1. Control: existing planner ranking.
2. Treatment: debt-prioritized ranking.

Success metrics:

1. repeat failure loop rate
2. next-day continuation quality

## Experiment C: Proof-Gated Completion

Hypothesis:
- Lightweight proof requirement increases transfer with acceptable added effort.

Variants:

1. Control: current completion path.
2. Treatment: proof-required completion.

Success metrics:

1. transfer score
2. completion conversion (guardrail)

## Event Additions (Status)

1. `friction_state_changed` (active)
2. `intervention_shown` (proposed)
3. `intervention_accepted` (proposed)
4. `intervention_dismissed` (proposed)
5. `intervention_outcome` (proposed)
6. `debt_created` (proposed)
7. `debt_paid` (proposed)
8. `proof_submitted` (proposed)
9. `proof_quality_scored` (proposed)

## Instrumentation Requirements

1. Stable user/session identity for all event paths.
2. Consistent dedupe strategy for rapid repeat actions.
3. Event payload schema contracts with size limits.
4. Event drop and failure monitoring.
5. Triage mutation audit events for AI and manual actions (active via `SessionFrictionTriageAudit` write path).

## Reporting Cadence

1. Daily: operational health and guardrails.
2. Weekly: intervention and debt trends.
3. Bi-weekly: experiment readouts with rollout decision.
4. Monthly: transfer score and cohort retention deep-dive.

## Decision Rules

Promote feature if:

1. Primary metric improves significantly.
2. No guardrail breach.
3. Operational stability remains acceptable.

Rollback if:

1. abandonment rises beyond threshold
2. completion integrity regresses
3. transfer metrics fail to improve after observation window
