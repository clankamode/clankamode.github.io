# Session OS v2 Release Playbook

Created: February 15, 2026
Last Updated: March 3, 2026
Status: Operating playbook with Transfer Score v0 quality readout and triage audit baseline active

## Purpose

Provide a safe rollout framework for session changes that touch progression, adaptation, and telemetry.

## Release Philosophy

1. Ship in narrow vertical slices.
2. Prefer silent mode before visible behavior changes.
3. Keep deterministic fallback always available.
4. Guardrails decide rollout pace.

## Required Pre-Release Artifacts

1. Product spec reference to this playbook.
2. Metrics plan with primary and guardrail targets.
3. Feature flags and kill switch mapping.
4. QA matrix for phase transitions and race conditions.
5. Rollback plan with owner and decision thresholds.

## Release Stages

## Stage 0: Local and Integration Validation

Checklist:

1. state invariants tests pass
2. telemetry schema validation passes
3. no regression in core execution route transitions

## Stage 1: Shadow Mode

Behavior:

1. compute new signals and decisions
2. do not show new UI interventions
3. record outcomes in telemetry only

Exit criteria:

1. signal quality acceptable
2. false positive rate within threshold

## Stage 2: Internal Dogfood

Behavior:

1. enable visible interventions for internal/admin cohort only
2. review intervention logs daily

Exit criteria:

1. no critical progression defects
2. guardrails stable for internal usage

## Stage 3: Limited Cohort

Behavior:

1. small percentage rollout
2. control cohort maintained
3. strict monitoring windows

Exit criteria:

1. primary metric trend positive
2. no guardrail breach

## Stage 4: Broad Rollout

Behavior:

1. expand percentage gradually
2. continue control group until confidence is high

Exit criteria:

1. durable improvements across multiple cohorts
2. operational stability maintained

## Feature Flag Matrix (Template)

Suggested flags:

1. `session_transition_lock_v2`
2. `friction_intelligence` (active in admin scope)
3. `session_interventions_v1`
4. `session_debt_planner_v1`
5. `session_transfer_scoring_v1`

Flag policy:

1. each flag has explicit owner
2. each flag has default off in production until promoted
3. each flag has cleanup plan once stable

Runtime baseline note:

1. transition lock semantics are now core runtime behavior; rely on invariant/race guardrails rather than a dedicated rollout flag for lock activation.

## Monitoring Plan

Real-time monitors:

1. transition errors
2. duplicate completion rates
3. finalize failures
4. intervention show/accept rates
5. abandonment after intervention

Daily monitors:

1. debt creation/paydown
2. repeat failure loop rate
3. quality-adjusted completion
4. AI triage audit write success/failure and review coverage

## Rollback Triggers

Immediate rollback if:

1. completion integrity breach
2. significant abandonment spike
3. finalize pipeline failures above threshold
4. intervention spam bug

Rollback actions:

1. disable highest-risk flag first
2. confirm deterministic fallback path
3. notify stakeholders with incident summary

## Incident Protocol

1. classify severity
2. assign incident owner
3. disable risky flags
4. validate baseline flow
5. publish incident summary and mitigation

## Post-Release Review

Within one week of each stage promotion:

1. compare against pre-registered metric targets
2. capture regressions and wins
3. document decisions and next adjustments
