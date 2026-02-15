# Execution Reading Surface Invariants

This checklist documents the execution-only reading surface constraints enforced by code.

## Audit Findings (before refactor)

- Execution width was set in `src/components/session/SessionReaderShell.tsx` using `max-w-3xl` (`~768px`), while `src/components/session/SessionHUD.tsx` used `max-w-screen-xl`, so the HUD and reading surface were not width-aligned.
- Blog-style rhythm came from `src/components/editor/BlockRenderer.tsx`:
  - heading spacing (`h2 mt-12`, `h3 mt-6`)
  - paragraph spacing (`p mt-4 text-lg`)
  - list spacing (`space-y-2`)
  - block stack (`space-y-5`)
- Code blocks in `src/components/editor/blocks/CodeBlock.tsx` read as secondary cards (`rounded-xl`, lighter border/background, `text-sm`).
- Callout/diagram blocks were styled as soft cards (`rounded-xl`), not compact instructional panels.

## Enforced Invariants (after refactor)

1. Canonical execution width:
   - `744px` max width only, defined once in `src/components/session/ExecutionSurface.tsx`.
   - Shared via `EXECUTION_SURFACE_LAYOUT_CLASS` in both `SessionReaderShell` and `SessionHUD`.
2. Execution typography/rhythm:
   - base reading text `15px`/`16px` equivalent, tighter heading tracking, reduced paragraph/list/section spacing.
   - no decorative divider treatment in execution mode (structural separators only).
3. Execution block hierarchy:
   - code blocks render as structural slabs (denser mono sizing, stronger border/foreground contrast).
   - callout/diagram blocks render as compact instrument panels with reduced corner radius and tighter internals.
4. Metadata scaffolding:
   - article header follows `title > subtitle > mono meta row` structure and is compacted in execution mode by surface-level selectors.
5. Surface ownership:
   - width/padding/typography ownership lives in `ExecutionSurface`; downstream execution renderers consume mode tokens rather than re-defining wide layout containers.
6. Reading Grid + rail:
   - execution surface is wrapped by `src/components/session/ReadingGrid.tsx`, which defines tokens for measure (`READING_GRID_MEASURE_CH`), cadence (`READING_GRID_VERTICAL_CADENCE_PX`), divider strength, and authority contrast levels.
   - `SessionReaderShell` mounts `SessionRail` through `ExecutionSurface` to anchor protocol progress + section context + why-next intent on a subtle structural spine.
7. Procedural navigation affordance:
   - chunk navigation uses a protocol step bar (integrated segmented control + keycaps) in `src/components/session/ChunkedArticleRenderer.tsx` instead of floating CTA styling.
