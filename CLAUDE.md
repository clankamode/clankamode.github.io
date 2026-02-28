# Claude Adapter Guide

> Adapter document for Claude-style assistants.
>
> Canonical agent instructions live in `AGENTS.md`.

## Source of Truth

1. `AGENTS.md` — canonical agent behavior, skills/workflows, validation commands, and gotchas.
2. `.agent/skills/*/SKILL.md` — task-specific implementation guidance.
3. `.agent/workflows/*.md` — command wrappers for skill usage.

## Required Guardrails

- Keep changes aligned with project conventions.
- Remove dead code and unused imports/types/functions when refactoring.
- For top-level nav/access changes, update contract + navbar + middleware + route in one pass.

## Validation Commands

- `npm run check:agent`
- `npm run typecheck:clean`
- `npm run verify`

## Related References

- `.cursorrules` (adapter for Cursor)
- `README.md` (runtime setup)
- `docs/QUICK_REFERENCE.md` (operational quick lookups)

## Historical Context (Non-Canonical)

- `docs/AI_AGENT_SETUP.md`
- `docs/IMPROVEMENTS_SUMMARY.md`
