# Session State Machine and Invariants

Created: February 15, 2026
Status: Proposed formal contract

## Goal

Define a deterministic state machine for session behavior with explicit invariants.
This document is intended to remove ambiguity in progression ownership and transition safety.

## Canonical State Model

Top-level phase:

1. `idle`
2. `entry`
3. `execution`
4. `exit`

Execution substate:

1. `current_index`
2. `current_chunk`
3. `total_chunks`
4. `transition_status`

Transition status:

1. `ready`
2. `advancing`
3. `finalizing`

## Allowed Top-Level Transitions

1. `idle -> entry`
2. `entry -> execution`
3. `execution -> execution` (chunk and item progression)
4. `execution -> exit`
5. `exit -> idle`

Disallowed transitions:

1. `idle -> exit`
2. `entry -> exit` without explicit abort path
3. `exit -> execution` unless starting a new committed session object

## Transition Ownership

Each transition must have one owner:

1. `entry -> execution`: gate session commit action
2. `execution(chunk)`: chunk navigation controller
3. `execution(item)`: canonical completion action
4. `execution -> exit`: canonical terminal progression action
5. `exit -> idle`: explicit reset/finalize completion

No two UI surfaces may call the same terminal transition without lock acquisition.

## Invariants

## Invariant 1: Single Item Advance

For a given `{session_id, item_id}`:

1. at most one successful item advance
2. duplicate user actions must be idempotently ignored

## Invariant 2: Monotonic Progression

`current_index` must never decrease during one session execution.

## Invariant 3: Chunk Bounds Safety

Always enforce:

1. `total_chunks >= 1`
2. `0 <= current_chunk < total_chunks`

## Invariant 4: Transition Lock Discipline

No `advance` or `finalize` operation may execute unless `transition_status == ready`.

Required lock sequence:

1. set status to `advancing` or `finalizing`
2. perform operation
3. set status back to `ready` or transition phase

## Invariant 5: Exit Integrity

Exit payload must include:

1. completed count
2. duration
3. final delta snapshot (or explicitly empty fallback)
4. session identity

## Invariant 6: Finalize Idempotency

Finalize writes should be deduped by deterministic key.
Multiple finalize attempts should not duplicate terminal records.

## Invariant 7: Session Persistence Compatibility

Hydrated session state from storage must be validated before use.
Invalid serialized state must be dropped and replaced with initial safe state.

## Invariant 8: Deterministic Fallback

If adaptive planner or classifier fails:

1. session progression remains valid
2. user can complete flow without adaptive features

## Invariant 9: UI/State Consistency

Rendered phase indicators, chrome mode, and progression controls must reflect the same source-of-truth state.

## Invariant 10: Telemetry Consistency

Lifecycle events must match state transitions.
Example:

1. `session_started` cannot occur after first `item_completed`
2. `session_finalized` cannot occur before exit begins

## Formal Transition Table

Legend:

1. Guard = required condition
2. Effect = state mutation
3. Side effects = network/log/persistence

### A. Commit Session

1. Source: `entry` or `idle`
2. Guard: valid scope with non-empty items
3. Effect: phase `execution`; index/chunk reset
4. Side effects: `session_started` telemetry

### B. Next Chunk

1. Source: `execution`
2. Guard: `current_chunk < total_chunks - 1`
3. Effect: increment chunk
4. Side effects: none required

### C. Prev Chunk

1. Source: `execution`
2. Guard: `current_chunk > 0`
3. Effect: decrement chunk
4. Side effects: none required

### D. Advance Item

1. Source: `execution`
2. Guard:
   - transition status `ready`
   - completion proof contract satisfied
3. Effect:
   - add current item to completed
   - increment index or transition to exit
4. Side effects:
   - `item_completed`, `step_completed`
   - next item prefetch (optional)

### E. Finalize Session

1. Source: `exit`
2. Guard: session identity present
3. Effect: commit terminal state and reset to `idle`
4. Side effects:
   - `session_finalized`
   - plan lock invalidation

### F. Abandon Session

1. Source: `execution`
2. Guard: explicit abandon action
3. Effect: phase `exit` with partial completion
4. Side effects: abandon/finalize telemetry path

## Proof Contract (Abstract)

A step can only advance when proof contract is satisfied for item type:

1. Learn item:
   - completion action plus lightweight retrieval/proof signal
2. Practice item:
   - test pass and completion confirmation

Proof can be configured by track and experiment cohort.

## Safety Test Matrix

Required test classes:

1. Rapid double-click on completion control
2. Keyboard and click race on terminal chunk
3. Route transition while advancing
4. Browser refresh during finalize
5. Multi-tab same session id edge cases

## Rollout Requirements

Before enabling adaptive interventions:

1. all invariants above must pass automated tests
2. transition lock logic must be active and observed in telemetry
3. duplicate completion rate must be below threshold

