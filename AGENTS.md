# Agent Configuration

> Canonical source of truth for agent behavior in this repository.
>
> If guidance here conflicts with `CLAUDE.md` or `.cursorrules`, follow this file.

## Primary Onboarding Path

1. Read this file.
2. Use skill docs in `.agent/skills/` when task-specific guidance is needed.
3. Run `npm run check:agent` before pushing changes that touch agent-facing docs, nav, or middleware.

## Skills

Located in `.agent/skills/`:

| Skill | Purpose |
|-------|---------|
| `brand-guidelines` | Cinematic Engineering design tokens & Nine Laws |
| `frontend-design` | Anti-AI-slop guidance for bold UI |
| `webapp-testing` | Playwright patterns for Next.js |
| `content-forge` | Blog authoring with block syntax & voice |
| `modular-refactor` | Component surgery (hooks/components/utils) |
| `void-mode-audit` | Subtractive design checklist |
| `supabase-patterns` | Database & API route conventions |
| `add-component` | Design-compliant component creation workflow |
| `code-review-checklist` | Severity-first PR/code review process |
| `create-pr` | Pull request preparation and structure |
| `debug` | Reproducible, hypothesis-driven debugging |
| `deslop` | AI-generated code cleanup and simplification |
| `setup-new-feature` | Feature initialization and scaffolding |

## Workflows

Located in `.agent/workflows/`:

| Command | Description |
|---------|-------------|
| `/add-component` | Wrapper for `add-component` skill |
| `/code-review-checklist` | Wrapper for `code-review-checklist` skill |
| `/create-pr` | Wrapper for `create-pr` skill |
| `/debug` | Wrapper for `debug` skill |
| `/deslop` | Wrapper for `deslop` skill |
| `/setup-new-feature` | Wrapper for `setup-new-feature` skill |

## Agent Validation Commands

- `npm run check:agent-docs` — validates skills/workflows table sync, npm script references, and local path references in agent-facing docs.
- `npm run check:nav-contract` — validates route/nav/middleware consistency against `src/config/navigationContract.ts`.
- `npm run check:agent` — runs all agent consistency checks.
- `npm run verify` — full local pre-PR check (`lint`, `typecheck:clean`, `test`, `check:agent`).

## Adapter Docs

These are adapter surfaces that should stay thin and point back to this file:

- `CLAUDE.md`
- `.cursorrules`

## Historical Docs (Non-Canonical)

These are historical context and should not be treated as operational source of truth:

- `docs/AI_AGENT_SETUP.md`
- `docs/IMPROVEMENTS_SUMMARY.md`

## Known Gotchas (Always Update Together)

**When deleting code:** remove unused variables, imports, types, and dead functions in the same change.

For top-level nav visibility/access changes (Learn, Videos, Practice, Session, Explore), update in one pass:

1. Contract: `src/config/navigationContract.ts`
2. Navbar rendering: `src/components/layout/Navbar.tsx` (desktop + mobile)
3. Middleware behavior: `src/middleware.ts` (logic + `config.matcher`)
4. Route file: `src/app/[section]/page.tsx` (or equivalent route)

Validation checklist: `npm run check:nav-contract` and `npm run check:agent`.
