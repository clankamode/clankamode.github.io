---
name: deslop
description: Remove AI-generated slop from the current branch — unnecessary comments, defensive over-engineering, type hacks, and style inconsistencies.
allowed-tools: Bash, Read, Edit, Grep
---

Remove AI-generated slop from the current branch diff vs main.

## Steps

1. Run `git diff main` to see all changes introduced in this branch
2. Review every changed file for AI slop patterns listed below
3. Remove all violations

## What Counts as Slop

**Unnecessary comments** — remove if:
- A human wouldn't add it to this codebase
- It restates what the code obviously does (`// increment counter`)
- It's inconsistent with comment style elsewhere in the file
- It's a section divider not used elsewhere (`// ---- Helpers ----`)

**Defensive over-engineering** — remove if:
- Extra try/catch on trusted internal calls
- Null checks on values that can't be null in context
- Input validation on internally-called functions (only validate at system boundaries)
- Redundant type guards

**Type hacks** — remove:
- `as any` casts (fix the types properly instead)
- `// @ts-ignore` without clear justification
- Unnecessary type assertions

**Style inconsistencies** — fix:
- Code style that doesn't match the surrounding file
- Variable naming pattern that differs from the rest of the file

**Other:**
- Trailing whitespace added
- Unused variables or imports added
- `console.log` debug statements left in
- Empty catch blocks
- Overly verbose error messages inconsistent with the codebase

## Output

Respond with only a 1-3 sentence summary of what you changed. No lists, no headers.
