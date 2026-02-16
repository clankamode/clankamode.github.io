# Session Future Documentation Pack

Created: February 15, 2026
Owner: Product + Engineering
Status: Draft strategy set for next feature cycle

## Purpose

This folder captures a long-horizon product direction for the learning session experience.
The intent is to move from a strong **session sequencer** (good at choosing the next steps)
to a robust **session governor** (good at regulating learning quality in real time).

This pack is intentionally opinionated. It includes decisions, rejected ideas, and explicit
tradeoffs so implementation can move fast without repeatedly re-litigating first principles.

## Document Map

1. `SESSION_OS_V2_VISION.md`
   - North star, principles, and product future.
2. `CURRENT_STATE_ATLAS.md`
   - Source-of-truth map of current runtime behavior and ownership.
3. `SESSION_GOVERNOR_OPERATING_MODEL.md`
   - Control model, state contracts, and intervention rules.
4. `SESSION_FRICTION_AND_DEBT_SPEC.md`
   - Friction detection and "session debt" settlement model.
5. `SESSION_STATE_MACHINE_AND_INVARIANTS.md`
   - Formal transition model, ownership, and non-negotiable invariants.
6. `SESSION_EVENT_AND_DATA_CONTRACT.md`
   - Event taxonomy, payload contracts, dedupe, and data model extensions.
7. `SESSION_INTERVENTION_POLICY_TABLE.md`
   - Deterministic intervention policy by friction state.
8. `SESSION_EXECUTION_BACKLOG.md`
   - Epic-level delivery backlog with acceptance criteria.
9. `SESSION_RELEASE_PLAYBOOK.md`
   - Rollout, guardrails, and rollback operating guidance.
10. `SESSION_ROADMAP_2026.md`
   - Rollout plan, milestones, and release gates.
11. `SESSION_METRICS_AND_EXPERIMENTS.md`
   - Metrics hierarchy and experiment backlog.
12. `SESSION_RISKS_AND_OPEN_QUESTIONS.md`
   - Risks, mitigations, unresolved decisions.
13. `SESSION_AI_TRIAGE_SAFETY_MODEL.md`
   - Safety contract for AI-assisted hotspot triage operations.
14. `SESSION_CONTROL_PLANE_HARDENING_PLAN.md`
   - Near-term hardening plan for docs, governance, and metrics integrity.

## Scope Boundary

This pack is strategy and product design documentation.
It does not include implementation code or schema migrations.

## How To Use This Pack

1. Read `SESSION_OS_V2_VISION.md` first.
2. Validate operating assumptions in `SESSION_GOVERNOR_OPERATING_MODEL.md`.
3. Use `SESSION_ROADMAP_2026.md` to pick the next execution batch.
4. Tie every feature PR to at least one metric in `SESSION_METRICS_AND_EXPERIMENTS.md`.
5. Track unresolved items in `SESSION_RISKS_AND_OPEN_QUESTIONS.md`.
