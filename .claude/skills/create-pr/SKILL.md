---
name: create-pr
description: Create a well-structured pull request — runs pre-PR checks, writes a clear description, and verifies multi-file consistency.
allowed-tools: Bash, Read, Glob
---

Create a pull request for the current branch.

## Steps

### 1. Verify Branch State
```bash
git status
git diff main --stat
git log main..HEAD --oneline
```

### 2. Pre-PR Checks
Fix any failures before creating the PR:
```bash
npm run lint
npm run typecheck
npm run build
```

### 3. Multi-File Consistency Check
If the diff touches navigation or routes, verify ALL of these were updated:

| File | What to Check |
|------|--------------|
| `src/app/[section]/page.tsx` | Page exists |
| `src/components/layout/Navbar.tsx` | Desktop nav link added |
| `src/components/layout/Navbar.tsx` | Mobile hamburger link added |
| `src/middleware.ts` | Public vs protected route logic |
| `src/middleware.ts` | `config.matcher` array includes route |

### 4. Write the PR

**Title format:** `type: brief description` (under 70 chars)
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change, no behavior change
- `chore:` deps, config, tooling

**Body:**
```
## What
[1-3 sentences describing the change]

## Why
[Motivation — what problem does this solve?]

## Changes
- File/component: what changed and why

## Testing
- [ ] Manually tested: [what you tested]
- [ ] `npm run test:e2e` passes
- [ ] `npm run typecheck` clean
- [ ] `npm run build` succeeds
```

### 5. Create via gh CLI
```bash
gh pr create --title "type: description" --body "$(cat <<'EOF'
[body]
EOF
)"
```
