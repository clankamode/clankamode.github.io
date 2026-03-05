# Session Control Plane Hardening Plan

Created: February 16, 2026
Last Updated: March 3, 2026
Owner: Product + Engineering
Status: Execution plan for the next delivery slice

## Goal

Harden the session control plane after early friction intelligence rollout.
Focus on correctness, governance, and measurable operations quality.

## Why This Slice

The system now has:

1. Friction signal capture
2. Snapshot persistence
3. Admin queue and triage operations
4. AI-assisted triage workflows

The remaining risk is not missing capability. The risk is weak governance around capability.

## Workstream A: Contract Reconciliation

Objective:

1. Remove strategy-to-runtime drift in session docs.

Deliverables:

1. Atlas reflects active transition lock and friction stack.
2. Event contract marks active versus proposed event families.
3. Backlog includes current reordering rationale.

Exit criteria:

1. No known contradictions between docs and runtime for session core paths.

## Workstream B: AI Triage Safety

Objective:

1. Make AI-assisted triage observable and reviewable.

Deliverables:

1. Safety model and constraints documented.
2. Audit trail schema and write path is implemented (`SessionFrictionTriageAudit`) and kept contract-aligned.
3. Confirm-before-apply policy, operator guardrails, and rollout decision plan.

Exit criteria:

1. Every AI mutation has a recoverable audit record.
2. Policy constraints and operator safeguards are explicit and enforced in rollout guidance.

## Workstream C: Metrics Operations v1

Objective:

1. Establish operational decision metrics before intervention UI rollout.

Deliverables:

1. Daily and weekly review dashboard contract.
2. Promotion and rollback thresholds for current stage.
3. Ownership for metric review cadence.

Exit criteria:

1. Two-week stable operations readout with no major blind spots.

## Workstream D: Reliability Backfill

Objective:

1. Close high-risk reliability debt still open from earlier epics.

Deliverables:

1. Stress coverage for progression and finalize interruption.
2. Reconciliation checks for learning-state writeback durability.
3. Clear incident runbook for session regressions.

Exit criteria:

1. Reliability guardrails green in pre-release stage checks.

## Sequencing

1. A and C run immediately.
2. B starts in parallel after schema agreement.
3. D continues in tandem with test ownership.

## Definition of Done

1. Control-plane docs are current.
2. AI triage has explicit safety and audit policy.
3. Metrics v1 is actively reviewed with named owners.
4. Release playbook stage and guardrails are explicitly updated.
