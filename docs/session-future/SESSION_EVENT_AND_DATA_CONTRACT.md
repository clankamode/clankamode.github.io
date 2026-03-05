# Session Event and Data Contract

Created: February 15, 2026
Last Updated: March 3, 2026
Status: Active core contract with staged adaptive extensions

## Purpose

Define a stable event and data contract for Session OS.
This is the observability backbone for friction detection, debt accounting, and transfer optimization.

## Event Design Principles

1. Events reflect meaningful state transitions, not every UI interaction.
2. Every event has deterministic identity fields.
3. Payloads are bounded and schema-validated.
4. Duplicate submission must be safe.
5. Event naming is verb-oriented and phase-aware.

## Common Event Envelope

All events should include:

1. `event_name`
2. `occurred_at`
3. `user_identity`
4. `session_id`
5. `track_slug`
6. `phase`
7. `source_surface`
8. `dedupe_key`
9. `payload`

## Canonical Event Families

## A. Lifecycle Events

1. `session_started`
2. `item_completed`
3. `step_completed`
4. `session_abandoned` (proposed explicit event)
5. `session_finalized`

## B. Practice Events

1. `coding_workspace_opened`
2. `practice_tests_ran`
3. `practice_completion_blocked`
4. `practice_completion_confirmed`

## C. Exit and Continuation Events

1. `ritual_completed`
2. `micro_shown`
3. `micro_clicked`

## D. Adaptive Events (Implementation Status)

1. `friction_state_changed` (active)
2. `intervention_shown` (proposed)
3. `intervention_accepted` (proposed)
4. `intervention_dismissed` (proposed)
5. `intervention_outcome` (proposed)
6. `debt_created` (proposed)
7. `debt_paid` (proposed)
8. `proof_submitted` (proposed)
9. `proof_quality_scored` (proposed)

## Operational Audit Stream (Active, Non-Telemetry Event Family)

This stream is implemented as operational data writes, not as `TelemetryEvents` event names.

1. `SessionFrictionTriageAudit` captures AI and manual triage mutations.
2. Use this stream for recoverability, review, and governance analytics.
3. Keep telemetry event family and audit stream responsibilities separate.

## Required Identity Contract

Identity fields must support dual identity sources:

1. email identity
2. provider id identity

Resolution rule:

1. always attempt canonical effective identity
2. include both fields when available
3. maintain consistency across all write paths

## Dedupe Contract

Every event class needs deterministic dedupe strategy:

1. lifecycle events:
   - keyed by `{session_id}:{event_name}:{step_or_item}`
2. intervention events:
   - keyed by `{session_id}:{intervention_id}:{event_name}`
3. finalize:
   - keyed by `{session_id}:session_finalized`

Dedupe key policy:

1. deterministic key preferred
2. random key disallowed for lifecycle
3. key must be generated before network write

## Payload Contract by Event

## session_started

Required:

1. `item_count`
2. `estimated_minutes`

Optional:

1. `track_variant`
2. `planner_version`

## item_completed

Required:

1. `item_href`
2. `item_title`
3. `index`

Optional:

1. `item_type`
2. `proof_type`
3. `proof_quality`

## practice_completion_blocked

Required:

1. `question_id`
2. `has_run`
3. `passed_count`
4. `total_tests`

Optional:

1. `failure_summary`
2. `error_class_distribution`

## ritual_completed

Required:

1. `concept_slug`
2. `skipped` boolean

Optional:

1. `choice_type`
2. `note_length`

## friction_state_changed (active)

Required:

1. `frictionState`
2. `confidence`
3. `trigger`
4. `signals`

## intervention_outcome (proposed)

Required:

1. `intervention_type`
2. `outcome`
3. `latency_ms`

Optional:

1. `quality_delta`
2. `completion_impact`

## Data Model Extensions (Proposed)

## A. Session Debt Table

Core fields:

1. `debt_id`
2. `user_identity`
3. `track_slug`
4. `session_id_origin`
5. `concept_slug`
6. `debt_type`
7. `severity`
8. `status`
9. `created_at`
10. `resolved_at`
11. `evidence_json`

## B. Proof Signal Table or Stream

Core fields:

1. `proof_id`
2. `session_id`
3. `item_key`
4. `proof_type`
5. `proof_value_hash`
6. `quality_score`
7. `created_at`

## C. Friction Snapshot Stream

Core fields:

1. `session_id`
2. `step_index`
3. `friction_state`
4. `confidence`
5. `signals_json`
6. `created_at`

Implemented table:

1. `SessionFrictionSnapshots`
2. deterministic dedupe key:
   - `{session_id}:{step_index}:{trigger}:{friction_state}`

Additional implemented admin triage table:

1. `SessionFrictionTriage`
2. key:
   - `{track_slug}:{step_index}`
3. fields:
   - `status`
   - `owner`
   - `notes`
   - `updated_by_email`
   - `updated_at`

Implemented audit table for triage mutations:

1. `SessionFrictionTriageAudit`
2. captures before/after status, owner, notes, rationale, and metadata for AI/manual updates
3. treated as operational audit stream rather than telemetry event family

## Contract Validation Rules

1. reject payloads over configured size limit
2. reject unknown event names by default
3. reject missing required identity/session fields
4. coerce known optional fields when safe
5. write schema errors to monitoring channel

## Backfill and Migration Notes

1. Keep old events readable.
2. Add version markers for new payload structures.
3. Build views that normalize legacy and new event names.

## Analytics Views (Proposed)

1. `session_lifecycle_view`
2. `session_quality_view`
3. `intervention_effectiveness_view`
4. `debt_aging_view`
5. `transfer_score_view`
6. `friction_hotspot_queue_view` (recommended next)

## Data Quality SLAs

1. lifecycle event availability: near real-time
2. dedupe error rate: below threshold
3. schema rejection rate: monitored daily
4. identity resolution failures: monitored with alerts
