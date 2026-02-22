---
name: code-review-checklist
description: Run a structured code review focused on correctness, regressions, security, and maintainability. Use when reviewing PRs, branches, or diffs and when producing severity-ranked findings.
---

# Code Review Checklist

Review changes systematically and report findings by severity.

## Review Order

1. Understand intent and changed files.
2. Find behavior risks first (bugs, regressions, broken assumptions).
3. Validate quality, security, and maintainability.
4. Confirm test coverage for changed behavior.

## Checklist

### Functionality

- Code does what the change claims.
- Edge cases are handled.
- Error handling matches risk and trust boundaries.
- No obvious logic bugs or off-by-one behavior.

### Code Quality

- Readable structure with focused functions/components.
- Naming is clear and consistent.
- No unnecessary duplication.
- Conventions in `.cursorrules` are followed.

### Security

- No hardcoded secrets.
- Inputs from users/external systems are validated.
- Sensitive data is not leaked in logs or responses.
- Authorization checks are present where needed.

### Testing

- New/changed behavior has tests (or justified gap).
- Existing tests likely still assert correct behavior.
- Manual verification steps are clear when automation is missing.

## Output Format

1. Findings first, ordered by severity (high to low).
2. Include file and line references for each finding.
3. Add open questions/assumptions if needed.
4. Add short summary only after findings.
