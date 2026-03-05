# Session Future Risks and Open Questions

Created: February 15, 2026
Last Updated: March 3, 2026
Status: Active decision log

## High-Risk Areas

### 1. Integrity Risk: Inconsistent Progression Ownership

Risk:
- Multiple completion mechanisms can cause duplicate or skipped progression.

Impact:
- Corrupt session state, inaccurate analytics, poor trust.

Mitigation:
- enforce single completion owner + transition lock invariant.

### 2. Data Quality Risk: Stale Learning State

Risk:
- Personalization quality degrades if exposure/internalization writeback is incomplete.

Impact:
- Adaptive planning appears smart but drifts into repetition.

Mitigation:
- verify writeback pathways and add reconciliation checks.

### 3. Product Risk: Intervention Fatigue

Risk:
- Over-frequent adaptive prompts create annoyance and abandonment.

Impact:
- Reduced completion and degraded UX trust.

Mitigation:
- strict cooldowns, one intervention at a time, high confidence threshold.

### 4. Measurement Risk: Optimizing Wrong Outcome

Risk:
- Teams optimize for completion volume over transfer quality.

Impact:
- artificial short-term gains, weak long-term learning.

Mitigation:
- prioritize transfer score and quality-adjusted completion metrics.

### 5. Technical Risk: Runtime Coupling

Risk:
- Heavy adaptive logic can slow execution surfaces.

Impact:
- latency, jitter, and reduced flow.

Mitigation:
- deterministic local policy first, async enrichment second.

## Medium-Risk Areas

1. Tone drift in intent messaging across system layers.
2. Ambiguous continuity between reading, assessment, and coding chamber.
3. Cohort contamination in experiments due to weak flag targeting.
4. Incomplete coverage in session invariants tests.

## Open Product Questions

1. What is the minimum proof signal per item type that users accept?
2. Should debt be visible to users as a first-class concept or kept implicit?
3. What intervention frequency is acceptable before perceived nagging?
4. Which friction states should be user-visible vs internal only?
5. Should "coast" interventions be automatic or opt-in?

## Open Technical Questions

1. What is the canonical source of truth for session progression state across routes?
2. Should session debt be persisted in a dedicated table or encoded in telemetry-derived views?
3. Is the current finalize durability strategy (sendBeacon + pagehide/visibilitychange + keepalive + dedupe) sufficient under observed failure modes?
4. Where should friction classification run: client, server, or hybrid?
5. What confidence threshold policy is stable across cohorts?

## Governance Questions

1. Who owns transfer score definition changes?
2. Who approves new intervention primitives?
3. What is the rollback SLA when guardrails trip?
4. Which team owns debt policy tuning?

## Explicitly Rejected Directions

1. Always-on chat tutor inside execution.
2. Heavy gamification mechanics as primary motivator.
3. Continuous autonomous LLM replanning in active execution.
4. More UI complexity without measurable transfer gains.

## Decision Log Template

Use this template for future decisions:

1. Decision:
2. Date:
3. Owner:
4. Options considered:
5. Why chosen:
6. Metrics impacted:
7. Rollback criteria:

## Decision Log Entries

1. Decision:
   - Friction classifier runs client-side in execution runtime; persistence is server-side.
2. Date:
   - February 16, 2026
3. Owner:
   - Product + Engineering
4. Options considered:
   - client
   - server
   - hybrid
5. Why chosen:
   - lowest latency for in-session signal capture with deterministic fallback on write failures
6. Metrics impacted:
   - friction coverage
   - execution latency
7. Rollback criteria:
   - disable `friction_intelligence` feature flag if write or latency guardrails breach

1. Decision:
   - Pulled friction observability ahead of full reliability backlog completion.
2. Date:
   - February 16, 2026
3. Owner:
   - Product + Engineering
4. Options considered:
   - strict original epic sequence
   - observability-first reordering
5. Why chosen:
   - needed live friction evidence to prioritize reliability and intervention design accurately
6. Metrics impacted:
   - queue operations readiness
   - hotspot identification lead time
7. Rollback criteria:
   - pause new adaptive work until reliability guardrails return to target bands
