# Session Governor Operating Model

Created: February 15, 2026
Status: Proposed

## Objective

Define how Session OS v2 governs learning quality during an active session.
This is a product control model, not an implementation spec.

## Core Model

The system runs three loops concurrently:

1. **Plan Loop** (pre-session)
   - Selects ordered items.
2. **Execution Loop** (in-session)
   - Monitors friction and applies minimal interventions.
3. **Learning Loop** (post-session)
   - Stores durable signals and affects future planning.

## Runtime State Stack

### A. Phase State

- `idle`
- `entry`
- `execution`
- `exit`

### B. Execution Friction State

Only relevant inside `execution`:

- `flow`
- `stuck`
- `drift`
- `fatigue`
- `coast`

### C. Intervention State

- `none`
- `pending`
- `active`
- `cooldown`

Constraint:
- At most one intervention can be active at a time.

## Session Constitution (Hard Rules)

These are non-negotiable product invariants:

1. **Single Completion Owner**
   - A session step can only be advanced by one canonical progression action.
2. **Transition Integrity**
   - Any advance/finalize action must acquire a transition lock.
3. **Proof Contract**
   - Completion requires item-type-appropriate proof signal.
4. **Intervention Cooldown**
   - Prevent repetitive prompts and oscillation.
5. **Debt Visibility**
   - Unresolved friction writes debt for future planning.
6. **Deterministic Fallback**
   - If adaptive logic fails, baseline session progression remains stable.

## Intervention Primitives

Use a small intervention set with explicit triggers:

1. `scope_down`
   - Shrink remaining work to a minimum viable win.
2. `focus_shift`
   - Move to a targeted section or rep that matches friction source.
3. `difficulty_adjust`
   - Slightly lower or raise challenge when mismatch is obvious.
4. `recovery_pause`
   - Offer a short protocol pause when fatigue signals spike.

Only one primitive per decision window.

## Decision Policy

Policy order:

1. Safety and integrity checks.
2. Friction state classification.
3. Intervention eligibility checks (cooldown, debt, confidence).
4. Intervention selection by fixed priority table.
5. Post-intervention observation window.

If classifier confidence is low:
- Do nothing.
- Keep collecting signal.

## Surface Contract

Every visible intervention must include:

1. Why this is appearing now.
2. The single recommended action.
3. The expected payoff.

No intervention can introduce more than one new concept at once.

## Cross-Surface Continuity Contract

Across gate, execution, practice chamber, and exit:

1. Keep one persistent "thread":
   - previous action
   - current action
   - next unlock
2. Keep language consistent for target concept.
3. Keep progression ownership and status consistent.

## Operational Guardrails

1. All adaptive behavior behind feature flags.
2. Interventions log structured outcome events.
3. Regression path available at all times (fallback to baseline flow).
4. No hard dependency on LLM calls during active execution.

## Failure Modes To Prevent

1. Intervention spam.
2. Contradictory guidance between surfaces.
3. Double-advance race conditions.
4. Drift toward motivational fluff in intent copy.
5. Pseudo-personalization from stale learning state.

## Implementation Readiness Checklist

Before rolling out adaptive interventions:

1. Progression invariants pass in tests.
2. Transition lock behavior validated under rapid input.
3. Telemetry schema supports friction + intervention outcomes.
4. Kill switch tested for every adaptive branch.
5. Manual QA confirms no broken route transitions in session mode.

