---
name: deslop
description: Remove low-signal AI-generated code patterns and align changes with repository style. Use before opening PRs or when refactoring generated code.
---

# Deslop

Clean generated code so it reads like intentional project code.

## What to Remove

- Redundant comments that restate obvious code.
- Defensive code that does not match local trust boundaries.
- Unnecessary `try/catch` wrappers in safe internal paths.
- Type escapes such as `any` used to bypass proper typing.
- Boilerplate abstractions that add indirection without value.

## Pass Checklist

1. Compare against nearby file style and simplify mismatches.
2. Delete dead code and cleanup now-unused imports/types/functions.
3. Keep only checks that protect real boundaries (user input, external APIs).
4. Keep behavior unchanged unless fixing a real bug.

## Output Expectation

Return a short summary (1-3 sentences) of what was removed or simplified.
