---
name: code-review
description: Thorough code review covering functionality, TypeScript correctness, security, design system compliance, and AI slop.
argument-hint: <file path or PR to review — defaults to branch diff vs main>
allowed-tools: Bash, Read, Grep, Glob
---

Perform a thorough code review of: $ARGUMENTS

If no argument given, review the current branch diff vs main (`git diff main`).

## Checklist

### Functionality
- [ ] Code does what it's supposed to do
- [ ] Edge cases handled appropriately
- [ ] Error handling present but not over-engineered
- [ ] No obvious bugs or logic errors

### Code Quality
- [ ] Functions small and focused (single responsibility)
- [ ] No code duplication
- [ ] Descriptive variable names
- [ ] Follows project conventions
- [ ] No unused imports, variables, or dead code

### TypeScript
- [ ] No `any` types
- [ ] `interface` used for object shapes (not `type`)
- [ ] Types are accurate and meaningful
- [ ] No `@ts-ignore` without justification

### Security
- [ ] No hardcoded secrets or API keys
- [ ] Input validated at system boundaries only (user input, external APIs)
- [ ] No SQL injection vectors
- [ ] No XSS risks (`dangerouslySetInnerHTML`, etc.)
- [ ] Auth checked in all protected API routes

### Multi-File Consistency
If the diff touches navigation or routes:
- [ ] `src/app/[section]/page.tsx` exists
- [ ] `src/components/layout/Navbar.tsx` — desktop nav updated
- [ ] `src/components/layout/Navbar.tsx` — mobile nav updated
- [ ] `src/middleware.ts` — route logic updated
- [ ] `src/middleware.ts` — `config.matcher` updated

### Design System
- [ ] Semantic color tokens used (not arbitrary hex)
- [ ] ≤3 accent instances per viewport
- [ ] ≤1 primary CTA per viewport
- [ ] Hover: translate + shadow lift (not bounce)
- [ ] Grayscale hierarchy holds without color

### API Routes
- [ ] `getToken({ req })` used for auth check
- [ ] Returns `NextResponse.json()` with correct status codes
- [ ] Error format: `{ error: string }`
- [ ] Raw Supabase errors not exposed to client

### AI Slop
- [ ] No unnecessary comments restating obvious code
- [ ] No excessive defensive checks on trusted internal calls
- [ ] No `as any` type casts
- [ ] Style consistent with surrounding file

## Output Format

List findings as:
> **[BLOCKER | WARNING | SUGGESTION]** `file/path.tsx`: Description

End with a 2-3 sentence overall assessment.
