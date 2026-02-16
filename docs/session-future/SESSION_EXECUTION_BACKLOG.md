# Session OS v2 Execution Backlog

Created: February 15, 2026
Last Updated: February 16, 2026
Status: Active backlog with in-flight reordering

## Implementation Snapshot (February 16, 2026)

Completed or partially completed work:

1. Epic 3 core silent mode is implemented:
   - classifier runtime in `SessionContext`
   - friction snapshot persistence
   - `friction_state_changed` telemetry path
2. Admin observability stack is implemented:
   - unified session intelligence dashboard
   - hotspot drill-down
   - triage workflow with status and owner
   - AI-assisted brief and recommendation actions
3. Remaining reliability and governance work is still required:
   - progression invariants hardening depth
   - finalize and writeback reconciliation
   - AI triage safety and audit model

## How To Use

Each epic includes:

1. Objective
2. High-level tasks
3. Acceptance criteria
4. Dependencies

Use this backlog as the bridge between strategy docs and implementation tickets.

## Epic 1: Progression Integrity Core

Objective:
- Guarantee deterministic, race-safe progression behavior.

Tasks:

1. enforce transition lock lifecycle (`ready -> advancing/finalizing -> ready`)
2. unify canonical completion ownership for read flow
3. add test coverage for rapid repeated completion actions
4. ensure finalize is idempotent and resilient

Acceptance criteria:

1. no duplicate item advancement under stress tests
2. no phase corruption after route transitions
3. finalize writes deduped by session key

Dependencies:

1. state machine contract
2. telemetry dedupe alignment

## Epic 2: Learning-State Writeback Completion

Objective:
- Ensure user learning state is updated from real session outcomes.

Tasks:

1. wire concept exposure/internalization updates into terminal session flow
2. add reconciliation checks between internalization artifacts and concept stats
3. monitor writeback success/failure metrics

Acceptance criteria:

1. concept stats updated after completed sessions
2. writeback failure path has observable alerting
3. planner consumes fresh state on subsequent sessions

Dependencies:

1. stable identity resolution
2. schema/RPC availability

## Epic 3: Friction Intelligence (Silent Mode)

Objective:
- Compute friction state in execution without user-facing intervention.

Tasks:

1. implement friction signal aggregator
2. implement classifier with confidence score
3. emit friction events for analysis

Acceptance criteria:

1. friction classification available for most sessions
2. classifier confidence distribution reviewed and accepted
3. no execution latency regression

Dependencies:

1. telemetry contract updates
2. monitoring dashboards

## Epic 4: Intervention Protocol v1

Objective:
- Introduce minimal adaptive interventions for high-confidence friction.

Tasks:

1. implement `scope_down` and `focus_shift` interventions
2. add cooldown and dismissal memory
3. instrument intervention outcomes

Acceptance criteria:

1. one intervention max at a time
2. intervention copy follows contract
3. acceptance and outcome telemetry captured

Dependencies:

1. friction classifier
2. UX placement decisions

## Epic 5: Session Debt Ledger

Objective:
- Track unresolved friction and pay it down through planning.

Tasks:

1. create debt model and events
2. generate debt on unresolved high-signal friction
3. close debt when remediation succeeds

Acceptance criteria:

1. debt records created and settled deterministically
2. debt aging and severity visible in reporting
3. duplicate debt merges correctly

Dependencies:

1. friction outcome quality
2. event/data contract

## Epic 6: Debt-Aware Planner Ranking

Objective:
- Prioritize debt paydown without collapsing exploration.

Tasks:

1. inject debt severity and concept history into planner scoring
2. enforce anti-repetition windows
3. preserve diversity constraints

Acceptance criteria:

1. repeat failure loops decline
2. novelty still appears after critical debt is cleared
3. no significant increase in abandonment

Dependencies:

1. debt ledger
2. planner ranking hooks

## Epic 7: Transfer Score and Quality-Adjusted Completion

Objective:
- Shift optimization target from activity to transfer.

Tasks:

1. define transfer score inputs and weights
2. compute quality-adjusted completion
3. add experimental readouts for adaptive cohorts

Acceptance criteria:

1. transfer score available in reporting
2. quality-adjusted completion becomes primary reporting metric
3. experiment decisions reference transfer outcomes

Dependencies:

1. proof signal instrumentation
2. delayed outcome tracking

## Epic 8: Test and Reliability Hardening

Objective:
- Protect session behavior with robust automated coverage.

Tasks:

1. align stale session invariants tests to current UI contracts
2. add race-condition tests around progression/finalization
3. add end-to-end checks for practice session handoff continuity

Acceptance criteria:

1. core session journey has reliable green path coverage
2. race and interruption scenarios are covered
3. test flakiness reduced below target threshold

Dependencies:

1. canonical state contracts
2. stable selectors for session surfaces

## Suggested Implementation Order

Current recommended order from this point:

1. Epic 1 (finish reliability depth)
2. Epic 2 (finish writeback and reconciliation)
3. Epic 8 (test hardening for invariants and interruption paths)
4. Epic 3b (friction control-plane hardening: docs, audit, metrics)
5. Epic 4
6. Epic 5
7. Epic 6
8. Epic 7

## Definition of Done (Global)

A session feature change is done only when:

1. state invariants are preserved
2. telemetry contract is updated
3. guardrail metrics are defined
4. rollback path is documented
5. current-state atlas is updated if architecture changed
