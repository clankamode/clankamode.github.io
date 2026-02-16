# Session Friction and Debt Spec

Created: February 15, 2026
Status: Proposed

## Why This Exists

Current telemetry captures events, but not a durable model of unresolved learning friction.
This spec introduces:

1. Friction classification during execution.
2. Debt accounting when friction is unresolved.
3. Debt paydown rules that influence future session plans.

## Friction States

### 1. Flow

Definition:
- User progresses at expected pace with stable quality signals.

Action:
- No intervention.

### 2. Stuck

Definition:
- User cannot complete current step despite attempts.

Typical indicators:
- repeated failed practice checks
- repeated back/forward chunk oscillation
- long dwell with no progression signal

Action:
- `scope_down` or `focus_shift`

### 3. Drift

Definition:
- User is still active but deviating from productive progression.

Typical indicators:
- route hops unrelated to current step
- repeated detail panel toggles without progress
- large elapsed time vs estimated without proof signal

Action:
- `scope_down` to minimum viable win

### 4. Fatigue

Definition:
- User attention and throughput degrade late in session.

Typical indicators:
- low interaction cadence
- repeated retries with low novelty
- ritual skip probability spikes

Action:
- `recovery_pause` or shorten remainder

### 5. Coast

Definition:
- User is under-challenged and can absorb higher leverage.

Typical indicators:
- very fast completion with high proof quality
- repeated low-friction sessions

Action:
- slight `difficulty_adjust` upward

## Friction Scoring (Conceptual)

Compute a friction score from weighted signals:

- pacing mismatch
- error recurrence
- navigation oscillation
- proof quality deficit
- ritual behavior context

Result:
- map score bands to friction states
- apply confidence threshold before intervention

If confidence is below threshold:
- classify as `flow` and continue observing

## Session Debt Ledger

Debt records unresolved learning obligations that should alter future planning.

### Debt Types

1. `execution_debt`
   - step not completed or completed without proof quality.
2. `ritual_debt`
   - exit reflection skipped or low-signal.
3. `concept_debt`
   - repeated friction on same concept family.
4. `practice_debt`
   - repeated blocked practice completions.

### Debt Record Fields (Conceptual)

- `debt_id`
- `user_identity`
- `track_slug`
- `concept_slug` (nullable)
- `debt_type`
- `severity` (1-5)
- `origin_session_id`
- `created_at`
- `status` (`open`, `paid`, `expired`)
- `evidence_summary`

## Debt Creation Rules

1. Create debt only on meaningful unresolved friction.
2. Merge duplicate debt for same concept and type in a time window.
3. Cap total open debt volume per user to avoid runaway pressure.

## Debt Paydown Rules

1. Future planner should preferentially clear high-severity debt.
2. New novelty is throttled while critical debt remains open.
3. Debt is marked paid when proof quality confirms recovery.
4. Debt can expire under strict policy if no longer relevant.

## Product Behavior With Debt

When debt exists, gate messaging should:

1. State the debt payoff objective in plain language.
2. Keep step count small.
3. Prefer short, high-confidence remediation sessions.

When no debt exists:

1. Allow normal exploration and progressive challenge.

## Anti-Patterns

Avoid:

1. Treating every skip as debt.
2. Using debt as a punitive streak mechanic.
3. Hiding debt logic from users while changing their plan.
4. Accumulating debt with no explicit payoff path.

## Rollout Strategy

Phase 1:
- Compute friction + debt silently, no UX changes.

Phase 2:
- Use debt in planning only, still minimal UI.

Phase 3:
- Surface explicit debt payoff paths to users.

## Success Criteria

1. Reduced repeat failure loops.
2. Increased completion quality, not just completion count.
3. Better next-day continuation consistency.
4. Fewer abandoned sessions after friction detection.

