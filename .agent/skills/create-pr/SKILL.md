---
name: create-pr
description: Prepare and structure pull requests with clear context, risk notes, and verification details. Use when finalizing a branch and opening a PR for review.
---

# Create PR

Ship changes with a review-ready PR.

## Workflow

1. Prepare branch:
- Ensure intended changes are committed.
- Rebase/merge from base branch if needed.
- Push branch and confirm CI status.
2. Validate quality gates:
- Run lint/typecheck/tests relevant to the change.
- Capture screenshots/videos for UI changes.
3. Write the PR body:
- Problem and context
- What changed
- Risk areas / breaking changes
- Verification steps
4. Set metadata:
- Clear title
- Labels
- Reviewers
- Linked issues/tasks

## PR Body Template

```md
## Summary
- ...

## Why
- ...

## Changes
- ...

## Verification
- [ ] Lint/typecheck pass
- [ ] Relevant tests pass
- [ ] Manual checks complete

## Risks / Follow-ups
- ...
```
