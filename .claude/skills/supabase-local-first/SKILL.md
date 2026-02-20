---
name: supabase-local-first
description: Safe Supabase workflow for free-tier projects. Always test schema changes locally before production. NEVER writes to production unless the user explicitly requests it AND confirms. Use when making any database changes (DDL, migrations, RLS policies, seed data).
argument-hint: <description of the database change>
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Supabase Local-First Workflow

**PRIME DIRECTIVE**: Never apply changes to the production Supabase project unless the user explicitly says "apply to production" or "push to production" AND confirms the production gate prompt. This includes `apply_migration`, `execute_sql`, and any other MCP tools that write to the remote project.

## Why Local First

This project is on the **free tier** — no branching available. A bad migration in production requires manual rollback. Local Supabase is free, fast, and fully isolated.

---

## Setup (one-time)

```bash
# Verify Supabase CLI is installed
supabase --version

# Start local Supabase stack (Postgres + Auth + Storage + Studio)
supabase start

# Output will show local credentials — keep these handy:
#   API URL:  http://127.0.0.1:54321
#   anon key: eyJ...
#   DB URL:   postgresql://postgres:postgres@127.0.0.1:54322/postgres
#   Studio:   http://127.0.0.1:54323
```

Create a `.env.local.local` (gitignored) or temporarily swap `.env.local` values:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key from supabase start>
```

---

## Workflow for Every Database Change

### Step 1 — Write the migration file locally

```bash
# Creates supabase/migrations/<timestamp>_<name>.sql
supabase migration new <descriptive_name>
```

Edit the generated file with your SQL. Write it to be idempotent where possible (`IF NOT EXISTS`, `IF EXISTS`).

### Step 2 — Apply and test locally

```bash
# Apply all pending migrations to local DB
supabase db push --local

# Or reset local DB to clean state and replay all migrations
supabase db reset

# Verify in Studio
open http://127.0.0.1:54323
```

Run the app against local Supabase and manually verify the feature works:
```bash
npm run dev
```

### Step 3 — Validate before production

Before touching production, confirm:
- [ ] Migration applies cleanly on local (`supabase db reset` passes)
- [ ] App behavior works as expected locally
- [ ] No data loss for existing rows
- [ ] RLS policies are correct (test with non-admin user if applicable)
- [ ] Migration is idempotent or safe to run once

### Step 4 — Production gate (ALWAYS ask)

**Stop here.** Before applying to production, always show the user this prompt:

---
> **Production gate**
> I'm about to apply the following to your **production** Supabase project:
>
> ```sql
> <paste the migration SQL here>
> ```
>
> This will affect live data. Type **"yes, apply to production"** to continue, or anything else to cancel.
---

Only proceed to Step 5 after the user explicitly confirms.

### Step 5 — Apply to production (only after confirmation)

Use `apply_migration` MCP tool with the exact same SQL that was tested locally.

```
apply_migration(
  project_id: "<prod project id>",
  name: "<same migration name>",
  query: "<exact SQL from local migration file>"
)
```

---

## DDL vs DML

| Type | Local test required | Production via |
|------|--------------------|----|
| DDL (CREATE TABLE, ALTER, DROP) | Yes — `supabase db push --local` | `apply_migration` MCP (after confirm) |
| DML (INSERT, UPDATE, DELETE) | Yes — run against local first | `execute_sql` MCP (after confirm) |
| RLS policies | Yes — test with local auth | `apply_migration` MCP (after confirm) |
| Seed data | Yes — `supabase/seed.sql` | `execute_sql` MCP (after confirm) |

---

## Stopping Local Supabase

```bash
supabase stop          # Stops containers, preserves local data
supabase stop --no-backup  # Stops and wipes local DB (clean slate)
```

---

## Gotchas

| Issue | Fix |
|-------|-----|
| Local migrations out of sync with prod | Run `supabase db pull` to capture prod schema into migrations |
| `supabase start` fails | Check Docker is running |
| Local anon key differs from prod | Expected — they're separate stacks |
| Migration timestamp collision | Rename file with a unique timestamp |
| Studio not loading | Give it 15–20s after `supabase start` |
