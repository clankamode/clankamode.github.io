# Session Experience Roadmap 2026

Created: February 15, 2026
Last Updated: February 16, 2026
Scope: Session OS v2 rollout

## Current Status Snapshot

1. Phase 1 is partially complete:
   - friction inference and observability shipped for admin scope
   - triage operations and AI assistance shipped for admin scope
2. Phase 0 reliability work remains partially open:
   - additional invariants stress coverage
   - writeback reconciliation depth
3. Next cycle priority:
   - control-plane hardening and reliability backfill before broad adaptive UI exposure

## Roadmap Goals

1. Improve transfer quality without increasing UI noise.
2. Increase completion reliability through progression integrity.
3. Introduce adaptive behavior safely with deterministic fallback.

## Phase 0: Reliability Backbone (Weeks 1-2)

Objective:
- Make current progression state and writeback trustworthy.

Workstreams:

1. Progression integrity hardening
   - enforce transition lock semantics
   - unify completion ownership
2. Learning-state writeback completion
   - ensure concept exposure/internalization updates are durable
3. Finalization durability
   - prevent lost finalize on interruption/drop-off paths

Exit criteria:

1. No double-advance in stress tests.
2. No silent loss of finalized session telemetry.
3. Learning-state updates visible in downstream planner inputs.

## Phase 1: Observability and Friction Inference (Weeks 3-5)

Objective:
- Build friction intelligence without changing UX yet.

Workstreams:

1. Friction signal model
2. Runtime friction state classifier
3. Debt ledger event model (write only)

Exit criteria:

1. Friction states computed for >= 90% of session executions.
2. Classification confidence and false-positive rates measured.
3. No measurable performance regression in execution mode.

## Phase 2: Adaptive Interventions v1 (Weeks 6-8)

Objective:
- Introduce minimal intervention protocol.

Workstreams:

1. `scope_down` and `focus_shift` interventions
2. Intervention cooldown and priority policies
3. UX integration in execution surfaces

Exit criteria:

1. Intervention accept rate reaches target band.
2. No increase in abandonment due to intervention exposure.
3. Completion quality improves vs control cohort.

## Phase 3: Debt-Aware Planning (Weeks 9-12)

Objective:
- Close unresolved loops in future sessions.

Workstreams:

1. Debt-aware planner ranking adjustments
2. Debt payoff gate messaging
3. Debt settlement tracking

Exit criteria:

1. Open debt volume trends downward for active users.
2. Repeat failure loops decrease.
3. Next-day continuation quality improves.

## Phase 4: Transfer Optimization (Quarterly)

Objective:
- Move objective function from completion to transfer.

Workstreams:

1. Delayed recall checks
2. Transfer score computation
3. Planner objective tuning with guardrails

Exit criteria:

1. Transfer score improvements persist over multiple cohorts.
2. Completion gains remain stable.
3. Fatigue-related abandonment does not increase.

## Release Strategy

Every adaptive phase must ship with:

1. Feature flag with role/user targeting.
2. Kill switch.
3. Control cohort.
4. Rollback playbook.

## Dependencies

1. Telemetry schema stability.
2. Auth identity consistency (email + provider id).
3. Session context reliability across execution routes.
4. Deterministic fallbacks when adaptive services fail.

## What Gets Deferred

1. Always-on tutor interfaces.
2. Rich gamification layers.
3. Full autonomous replanning in-session.
