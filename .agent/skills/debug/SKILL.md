---
name: debug
description: Diagnose and fix bugs with a reproducible, hypothesis-driven process. Use when investigating failing tests, runtime errors, unexpected UI behavior, or regressions.
---

# Debug

Use a tight loop: reproduce, isolate, hypothesize, verify.

## Workflow

1. Reproduce
- Capture exact steps.
- Record expected vs actual behavior.
- Save error text, stack traces, and environment details.
2. Isolate
- Identify smallest failing path.
- Check recent changes with git diff/history.
- Add targeted logs or breakpoints.
3. Hypothesize
- State the cause in one sentence: "X fails because Y."
- Test with a minimal, reversible change.
4. Fix
- Implement the smallest safe fix.
- Avoid unrelated refactors in the same patch.
5. Verify
- Confirm original issue is fixed.
- Run affected automated tests.
- Check adjacent behavior for regressions.
6. Guard
- Add or update tests to prevent repeat failures.
- Add concise comment only for non-obvious logic.
