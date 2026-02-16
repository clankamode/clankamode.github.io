# Agent Configuration

This repository is configured for AI-assisted development with Antigravity.

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

## Workflows

Located in `.agent/workflows/`:

| Command | Description |
|---------|-------------|
| `/add-component` | Create design-compliant React components |
| `/code-review-checklist` | Comprehensive code review |
| `/create-pr` | Well-structured pull requests |
| `/debug` | Systematic debugging process |
| `/deploy` | Vercel deployment with safety checks |
| `/deslop` | Remove AI slop and redundant comments |
| `/setup-new-feature` | Feature initialization |
| `/test-editor` | Block Editor E2E testing |

## Quick Start

1. **Ask for a component**: "Create a card component following the design system"
2. **Debug a test**: "Follow the debug workflow for this Playwright failure"
3. **Review code**: "Run the code-review-checklist workflow on this PR"

## Key Files

- `.cursorrules` - Project conventions and styling rules
- `docs/DESIGN_PRINCIPLES.md` - Full design specification (if still present)
- `.cursor/rules/data-structure-practice-questions.mdc` - Creating "Implement X From Scratch" practice questions

## Known gotchas (always update together)

**When deleting code:** Always clean up unused variables, imports, types, and functions left behind. Do not leave dead code or unused declarations.

These changes **require updating multiple files** in one pass. Do not only edit the page or one component.

| Change | Update these together |
|--------|------------------------|
| **Show/hide or change access to a top-level nav item** (e.g. Learn, Videos, Practice) | 1. Page route (`src/app/[section]/page.tsx`) · 2. **Navbar** `src/components/layout/Navbar.tsx` (desktop nav + mobile nav, and both editor/default branches if relevant) · 3. **Middleware** `src/middleware.ts` (public vs protected logic + `config.matcher`) |

See `.cursorrules` → "Known gotchas (multi-file consistency)" for the full checklist.
