# Current State Atlas: Session Experience

Created: February 15, 2026
Last Updated: February 16, 2026
Purpose: High-fidelity map of the current production session system
Audience: Product, engineering, design, and analytics

## Intent

This document is a source-of-truth snapshot of how session mode currently works.
It is deliberately concrete and file-referenced so future planning stays grounded in reality.

## System Topology

The current session experience is distributed across six runtime layers:

1. **Global app shell + chrome mode selection**
2. **Session state machine and transitions**
3. **Session planning and candidate selection**
4. **Execution surfaces (reading + practice)**
5. **Exit/ritual/finalization**
6. **Telemetry and persistence**

## 1) Global Shell and Chrome Control

### Root Composition

`/Users/issackjohn/repos/personal-website/src/app/layout.tsx`

Current provider stack:

1. `AuthProvider`
2. `SessionProvider`
3. `VideoProvider`
4. `AppShell`

### Chrome Mode Resolution

`/Users/issackjohn/repos/personal-website/src/hooks/useChromeMode.ts`

Modes:

1. `marketing`
2. `app`
3. `gate`
4. `execute`
5. `exit`
6. `studio`

Key rule:

- Active session phase overrides route chrome (`execution -> execute`, `exit -> exit`) when session mode is enabled.

### Shell Visibility

`/Users/issackjohn/repos/personal-website/src/components/layout/AppShell.tsx`

Current behavior:

1. Adds `data-session-phase` on root container.
2. Shows/hides navbar/footer based on chrome mode.
3. Suppresses feedback widget in `execute` and `exit`.

## 2) Session State Machine

### Session State Source

`/Users/issackjohn/repos/personal-website/src/contexts/SessionContext.tsx`

Current phase model:

1. `idle`
2. `entry`
3. `execution`
4. `exit`

Execution state includes:

1. `sessionId`
2. `currentIndex`
3. `completedItems`
4. `startedAt`
5. `currentChunk`
6. `totalChunks`
7. `transitionStatus`

Persistence:

1. Session state stored in `sessionStorage` as `session:state:v1`.
2. Last micro concept stored in `localStorage` as `session:last-micro-concept:v1`.

### Core Transitions

1. `commitSession(scope)`:
   - enters `execution`, sets index/chunk timers.
2. `advanceItem()`:
   - marks item complete and moves index.
   - when final item reached, transitions to `exit`.
3. `abandonSession()`:
   - transitions to `exit` with empty delta.
4. `resetToEntry()`:
   - resets to initial `idle`.
5. `nextChunk()/prevChunk()/setTotalChunks()`:
   - controls in-article chunk progression.

Note:

- `transitionStatus` is now actively exercised via transition lock semantics.
- `advanceItem`, `completeSession`, and `abandonSession` run through `runWithTransitionLock`.
- lock state uses `ready -> advancing/finalizing -> ready`.

## 3) Session Planning Pipeline

### Session State Construction

`/Users/issackjohn/repos/personal-website/src/lib/progress.ts`

`getSessionState(userId, preferredTrackSlug, googleId)` is the planner entry.

Current pipeline:

1. Get progress summary and learning library.
2. Resolve preferred track and user learning state.
3. Build learn candidates:
   - full article items
   - focused chunk items (`?sessionChunk=`).
4. Build practice candidates from `InterviewQuestions`.
5. Optionally filter recently finalized item hrefs (8h lookback from telemetry).
6. Compute outcome signals.
7. Plan with LLM planner (`planSessionItemsWithLLM`) when generative mode is enabled.
8. Cache short-lived plan lock (`session-plan-lock:v1:{user}:{track}`).
9. Return `now`, `upNext`, `proof`, `track`, and session mode.

### LLM Planner

`/Users/issackjohn/repos/personal-website/src/lib/session-llm-planner.ts`

Capabilities:

1. Candidate frontier gating.
2. Optional ranker stage.
3. Prompt with rubric and diversity constraints.
4. Validation and retries.
5. Heuristic fallback and budget limits.

### Intent Derivation

1. Static and state-aware intent:
   - `/Users/issackjohn/repos/personal-website/src/lib/gate-intent.ts`
2. Display sanitization:
   - `/Users/issackjohn/repos/personal-website/src/lib/intent-display.ts`

## 4) Gate Flow (Entry)

### Home Route

`/Users/issackjohn/repos/personal-website/src/app/home/page.tsx`

Behavior:

1. Requires authenticated user.
2. Requires progress + session mode flags.
3. Fetches planned session state and last internalization primer.

### Gate Client

`/Users/issackjohn/repos/personal-website/src/app/home/HomeClient.tsx`

Behavior:

1. Renders gate view in normal case.
2. Switches to exit view when session phase is `exit`.
3. Emits `home_card_rendered` telemetry.

### Gate Card

`/Users/issackjohn/repos/personal-website/src/app/home/_components/NowCard.tsx`

Behavior:

1. Shows mission, scope, and target concept.
2. Commits session on CTA and routes to first item.
3. Emits `gate_shown` and `session_committed`.

## 5) Execution Flow: Reading Surface

### Route Integration

`/Users/issackjohn/repos/personal-website/src/app/learn/[pillar]/[slug]/page.tsx`

Behavior:

1. Resolves optional `sessionChunk` query.
2. Renders article via `ChunkedArticleRenderer`.
3. Delegates page layout to `ArticleLayoutSwitcher`.

### Mode Switcher

`/Users/issackjohn/repos/personal-website/src/app/learn/_components/ArticleLayoutSwitcher.tsx`

Behavior:

1. In `execute` mode, wraps content in `SessionReaderShell`.
2. Mounts `SessionCommitControl` inside execution mode.
3. In non-session mode, renders standard sidebars + footer.

### Reader Shell

`/Users/issackjohn/repos/personal-website/src/components/session/SessionReaderShell.tsx`

Behavior:

1. Fixed HUD at top.
2. Execution surface with optional rail.
3. Toggleable right drawer (`T`, `Escape`).

### Execution Surface + Grid

1. `/Users/issackjohn/repos/personal-website/src/components/session/ExecutionSurface.tsx`
2. `/Users/issackjohn/repos/personal-website/src/components/session/ReadingGrid.tsx`

Current invariants:

1. Canonical width class: `max-w-[744px]`.
2. Reading grid measure and cadence tokens.
3. Rail and structural spine in lg view.

### Chunk Navigation

`/Users/issackjohn/repos/personal-website/src/components/session/ChunkedArticleRenderer.tsx`

Behavior:

1. Splits content into chunks and syncs total chunks to context.
2. Keyboard navigation:
   - previous: `ArrowLeft` / `h`
   - next: `ArrowRight` / `l`
3. Last chunk action calls `advanceItem()`.

### Chunking Primitive

`/Users/issackjohn/repos/personal-website/src/lib/article-chunking.ts`

Current logic:

1. Splits on markdown `##` headings.
2. Defaults to Introduction chunk when no heading encountered.

## 6) Execution Flow: Practice Path

### Session Practice Route

`/Users/issackjohn/repos/personal-website/src/app/session/practice/[questionId]/page.tsx`

Behavior:

1. Delegates to `AssessmentClient` with forced question id.

### Assessment Client Session Mode

`/Users/issackjohn/repos/personal-website/src/app/assessment/_components/AssessmentClient.tsx`

Behavior when current session item is practice:

1. Uses `SessionReaderShell` as execution wrapper.
2. Shows question summary and rationale context.
3. Launches coding chamber route with session context query params.
4. Tracks workspace opened/run signals via sessionStorage.

### Coding Chamber

`/Users/issackjohn/repos/personal-website/src/app/code-editor/_components/PracticeEditor.tsx`

Behavior:

1. Runs tests with Pyodide runner.
2. Blocks progression if tests are not passing.
3. Emits:
   - `practice_tests_ran`
   - `practice_completion_blocked`
   - `practice_completion_confirmed`
4. On success in session context, calls `advanceItem()` and navigates to next item.

## 7) Exit Flow

### Exit Surface

`/Users/issackjohn/repos/personal-website/src/app/home/_components/SessionExitView.tsx`

Behavior:

1. Shows completion receipt and internalization ritual.
2. Persists ritual choice via server action.
3. Shows optional micro-session proposal.
4. Finalization call to `/api/session/finalize`.

### Internalization Save

`/Users/issackjohn/repos/personal-website/src/app/actions/internalize.ts`

Behavior:

1. Inserts into `UserInternalizations`.
2. Attempts to increment concept internalization stats.
3. Falls back to upsert in `UserConceptStats` if RPC fails.

### Session Finalize API

`/Users/issackjohn/repos/personal-website/src/app/api/session/finalize/route.ts`

Behavior:

1. Auth + feature gate checks.
2. Inserts `session_finalized` telemetry with completed item list.
3. Invalidates session plan lock cache key.

## 8) Telemetry Model (Current)

### Client Helper

`/Users/issackjohn/repos/personal-website/src/lib/telemetry.ts`

### Server Action

`/Users/issackjohn/repos/personal-website/src/app/actions/telemetry.ts`

Allowed event family includes:

1. Gate/session lifecycle:
   - `gate_shown`
   - `session_committed`
   - `session_started`
   - `item_completed`
   - `step_completed`
   - `session_finalized`
2. Exit/micro:
   - `ritual_completed`
   - `micro_shown`
   - `micro_clicked`
3. Practice:
   - `coding_workspace_opened`
   - `practice_tests_ran`
   - `practice_completion_confirmed`
   - `practice_completion_blocked`
4. Friction:
   - `friction_state_changed`

### Friction Intelligence and Admin Observability

Friction runtime and persistence:

1. Classifier:
   - `/Users/issackjohn/repos/personal-website/src/lib/friction-classifier.ts`
2. Snapshot payload normalization:
   - `/Users/issackjohn/repos/personal-website/src/lib/friction-snapshot.ts`
3. Snapshot server write action:
   - `/Users/issackjohn/repos/personal-website/src/app/actions/friction.ts`
4. Snapshot table:
   - `SessionFrictionSnapshots`

Admin observability and triage:

1. Dashboard:
   - `/Users/issackjohn/repos/personal-website/src/app/admin/session-intelligence/page.tsx`
2. Triage action path:
   - `/Users/issackjohn/repos/personal-website/src/app/actions/friction-triage.ts`
3. Triage table:
   - `SessionFrictionTriage`
4. AI decision registry:
   - `SessionAIDecisions`
5. Capabilities:
   - friction queue filters and risk sorting
   - hotspot drill-down evidence
   - manual status and owner updates
   - AI brief generation
   - AI owner and status recommendation
   - batch auto-triage for top queue rows
   - AI replay summary with override proxy metrics

## 9) Access Control and Routing

### Middleware

`/Users/issackjohn/repos/personal-website/src/middleware.ts`

Current behavior:

1. Session and progress feature flags gate `/home` and `/session/*`.
2. Auth required for session routes and coding practice routes.
3. `/learn/*` is generally public except progress routes.
4. Redirect rules enforce fallback to `/learn` when session features disabled.

## 10) Test Coverage Snapshot

Relevant tests:

1. `/Users/issackjohn/repos/personal-website/tests/session-mode.spec.ts`
2. `/Users/issackjohn/repos/personal-website/tests/session-telemetry.spec.ts`
3. `/Users/issackjohn/repos/personal-website/tests/session-invariants.spec.ts`
4. `/Users/issackjohn/repos/personal-website/tests/unit/execution-reading-surface.test.ts`
5. `/Users/issackjohn/repos/personal-website/tests/unit/session-planner-invariants.test.ts`
6. `/Users/issackjohn/repos/personal-website/tests/unit/session-logic.test.ts`
7. `/Users/issackjohn/repos/personal-website/tests/unit/friction-classifier.test.ts`
8. `/Users/issackjohn/repos/personal-website/tests/unit/friction-payload-shape.test.ts`
9. `/Users/issackjohn/repos/personal-website/tests/unit/session-friction-integration.test.ts`
10. `/Users/issackjohn/repos/personal-website/tests/unit/session-ai-replay.test.ts`

Coverage strengths:

1. Chrome mode and execution shell invariants.
2. Planner prompt invariants.
3. Key telemetry events.
4. Friction classifier deterministic behavior and payload shape.
5. Source-level integration guard for friction wiring in `SessionContext`.

Coverage limitations:

1. Some invariant tests appear out-of-sync with current labels/selectors.
2. Limited stress coverage for rapid repeated progression actions.
3. Limited coverage for finalize interruption edge cases.

## 11) Current Seams and Tensions

This section captures objective seams, not future proposals:

1. Progression control has multiple advancing surfaces in reading mode.
2. Transition status fields exist but are not fully exercised.
3. Learning-state exposure updates are not clearly invoked in session completion path.
4. Chunking is heading-level and may vary in granularity by content authoring style.
5. Cross-surface continuity between assessment and coding chamber is functional but verbose.
6. AI triage updates depend on override-proxy interpretation; direct quality labels are still not explicit.

## 12) Known Strong Foundations

1. Explicit and understandable phase-driven session model.
2. Cohesive execution shell with dedicated HUD/rail/surface ownership.
3. Flexible planner with deterministic fallback behavior.
4. Rich telemetry event catalog and identity-aware logging path.
5. Feature flag architecture suitable for staged rollout.

## 13) Update Contract

When session architecture changes, update this atlas in the same PR.

Minimum update checklist:

1. New/changed phase transitions.
2. New progression owner or completion contract.
3. New telemetry events or payload contract.
4. New route transitions in session mode.
5. New test files or removed coverage.
