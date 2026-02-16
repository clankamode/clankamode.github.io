# Session AI Triage Safety Model

Created: February 16, 2026
Owner: Product + Engineering
Status: Active safety contract for admin-only AI triage

## Purpose

Define safe operating rules for AI-assisted triage in Session Intelligence.
This model applies to:

1. AI brief generation
2. AI owner and status recommendation
3. Batch auto-triage actions

## Scope

In scope:

1. Admin-only operations on `SessionFrictionTriage`
2. AI-generated updates to `status`, `owner`, and `notes`
3. Operational monitoring for AI triage quality

Out of scope:

1. User-facing interventions
2. Planner ranking changes
3. Debt ledger writes

## Safety Principles

1. AI assists; human remains accountable.
2. AI outputs must be explainable from captured evidence.
3. High-impact changes should be reviewable and auditable.
4. If AI fails, deterministic manual triage must remain available.
5. No AI dependency in execution runtime path.

## Allowed Mutations

AI triage may mutate only:

1. `SessionFrictionTriage.status`
2. `SessionFrictionTriage.owner`
3. `SessionFrictionTriage.notes`
4. `SessionFrictionTriage.updated_by_email`

AI triage must not mutate:

1. Session progression state
2. Friction snapshot records
3. Planner outputs
4. User-visible learning flow

## Current Controls

Already in place:

1. Admin role enforcement on triage actions.
2. Track and step input validation.
3. Notes size bounds and owner normalization.
4. Deterministic fallback behavior when AI key is missing.

## Required Next Controls

1. Mutation audit trail table:
   - actor
   - action type
   - before values
   - after values
   - rationale
   - timestamp
2. Optional confirm-before-apply mode for AI recommendations.
3. Batch auto-triage run summary:
   - attempted
   - succeeded
   - failed
   - skipped
4. Alerting when AI sets `resolved` without substantial notes.

## Quality Guardrails

Monitor weekly:

1. AI recommendation override rate.
2. Share of AI-set resolved rows reopened within 7 days.
3. Median time-to-owner assignment on new hotspots.
4. Share of triage rows with empty or low-signal notes.

Rollback triggers:

1. AI recommendations produce sustained high override rate.
2. Reopen rate exceeds agreed threshold.
3. Mutation errors spike or produce invalid queue behavior.

Rollback actions:

1. Disable AI recommendation and batch actions.
2. Keep manual triage active.
3. Preserve existing triage records and notes.

## Decision Log

Decision:

1. Keep AI triage admin-only until audit trail and confirm mode ship.

Date:

1. February 16, 2026
