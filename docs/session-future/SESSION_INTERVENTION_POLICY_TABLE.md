# Session Intervention Policy Table

Created: February 15, 2026
Status: Proposed policy

## Goal

Standardize when interventions appear, what action they propose, and how success is measured.
The policy is intentionally small to keep execution mode focused and predictable.

## Global Rules

1. Maximum one active intervention at a time.
2. No intervention in first minute unless severe friction signal.
3. Respect cooldown between interventions.
4. If confidence is low, do nothing.
5. Every intervention must declare expected payoff.

## Intervention Types

1. `scope_down`
2. `focus_shift`
3. `difficulty_adjust_down`
4. `difficulty_adjust_up`
5. `recovery_pause`

## State-to-Intervention Mapping

## Flow

Primary action:
- none

Allowable:
- optional `difficulty_adjust_up` only when consistent over-performance is high confidence

## Stuck

Priority:

1. `focus_shift`
2. `scope_down`

Do not show:

1. `difficulty_adjust_up`

## Drift

Priority:

1. `scope_down`
2. `focus_shift`

Do not show:

1. `difficulty_adjust_up`

## Fatigue

Priority:

1. `recovery_pause`
2. `scope_down`

Do not show:

1. `difficulty_adjust_up`

## Coast

Priority:

1. `difficulty_adjust_up`
2. continue without intervention

Do not show:

1. `recovery_pause` unless conflicting fatigue signal appears

## Decision Inputs

Use weighted signals from:

1. pacing mismatch
2. repeated errors
3. navigation oscillation
4. completion proof quality
5. session elapsed vs plan
6. recent friction history in-session

## Eligibility Conditions

Before showing intervention:

1. confidence >= threshold
2. cooldown complete
3. user has not dismissed same intervention repeatedly
4. no active finalizing transition
5. target action is currently feasible

## Cooldown Policy

1. minimum cooldown after dismissal
2. minimum cooldown after acceptance
3. stricter cooldown for fatigue-related interventions
4. reset cooldown between sessions unless unresolved debt severity is high

## Copy Contract

Each intervention copy block must include:

1. Why now
2. Recommended action
3. Expected outcome

Copy style rules:

1. no motivational hype language
2. causal and concrete phrasing
3. one primary CTA

## Outcome Classification

For each intervention attempt, classify outcome:

1. `accepted_helpful`
2. `accepted_neutral`
3. `accepted_harmful`
4. `dismissed`
5. `expired`

## Success Criteria by Type

## scope_down

Success when:

1. session reaches valid completion with quality signal
2. abandonment decreases for drift cohort

## focus_shift

Success when:

1. blocked attempts decrease after shift
2. step completion quality improves

## difficulty_adjust_down

Success when:

1. completion recovers without repeated failure loops

## difficulty_adjust_up

Success when:

1. quality remains high and abandonment stable

## recovery_pause

Success when:

1. session resumes and completes with no sharp quality drop

## Safety Stops

Hard disable intervention display if:

1. event pipeline unhealthy
2. classifier confidence model degraded
3. abandonment guardrail breached
4. transition integrity errors spike

## Policy Review Cadence

1. weekly review of intervention outcomes
2. bi-weekly threshold tuning
3. monthly policy simplification pass

