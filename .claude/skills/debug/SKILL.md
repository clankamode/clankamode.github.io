---
name: debug
description: Systematically diagnose and fix bugs. Use when something is broken and the cause isn't immediately obvious.
argument-hint: <description of the issue>
allowed-tools: Read, Grep, Glob, Bash, Edit
---

Systematically debug the following issue: $ARGUMENTS

## Process

### 1. Reproduce
- Identify exact steps to trigger the bug
- Capture: expected vs actual behavior
- Collect: error messages, stack traces, network logs

### 2. Isolate
- Check recent changes: `git diff main`
- Check git log: `git log --oneline -20`
- Narrow to the smallest reproduction case

### 3. Hypothesize
Form a clear hypothesis: *"The bug is caused by X because Y"*
- Test with a minimal change
- Don't fix multiple things at once

### 4. Fix
- Make the smallest change that resolves the issue
- Don't refactor unrelated code in the same fix

### 5. Verify
- Confirm original issue is resolved
- Run: `npm run lint && npm run typecheck`
- Check for regressions in adjacent functionality

## Common Failure Points in This Stack

| Symptom | Check First |
|---------|------------|
| API 401 | `getToken({ req })` — is JWT being read correctly? |
| API 500 | Supabase error — log `error.message` from destructured response |
| Data not showing | Server vs client component mismatch |
| Auth state broken | Check `useSession()` status before acting on session |
| RLS blocking reads | Check Supabase policies or use `supabaseAdmin` client |
| Middleware not running | Check `config.matcher` in `src/middleware.ts` |
| Build failure | Run `npm run typecheck` to isolate type errors first |

## E2E Debugging

```bash
npm run test:e2e
npx playwright test --debug
```

Reconnaissance pattern:
```typescript
await page.goto('http://localhost:3000/[route]');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'debug.png', fullPage: true });
```
