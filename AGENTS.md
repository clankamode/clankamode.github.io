# Agent Guidelines

## 🧠 Coding Principles (all agents)

Derived from [Karpathy's LLM pitfalls](https://x.com/karpathy/status/2015883857489522876). Bias toward caution over speed; use judgment on trivial tasks.

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, **ask** — don't guess and run.
- If multiple interpretations exist, present them. Don't pick silently.
- Push back when a simpler approach exists. Stop when confused.

### 2. Simplicity First
- No features beyond what was asked. No speculative abstractions.
- No "flexibility" or "configurability" that wasn't requested.
- If 200 lines could be 50, rewrite it.
- Test: "Would a senior engineer call this overcomplicated?" If yes, simplify.

### 3. Surgical Changes
- Touch only what the task requires. Don't "improve" adjacent code/comments/formatting.
- Match existing style, even if you'd do it differently.
- Remove imports/variables YOUR changes orphaned. Leave pre-existing dead code alone (mention it, don't delete).
- Every changed line should trace directly to the request.

### 4. Goal-Driven Execution
- Transform tasks into verifiable goals with success criteria.
- For multi-step work, state a brief plan with verify steps.
- Strong success criteria → independent looping. Weak criteria → ask first.

## Cursor Cloud specific instructions

### Project overview
Static portfolio/blog site (Vite + Lit Web Components + TypeScript). No database, no Docker. All content is static; live telemetry widgets fetch from an external Cloudflare Worker API (`clanka-api`) which is optional — widgets degrade gracefully when offline.

### Node version
CI uses **Node.js 24**. The update script installs it via nvm and sets it as the default. Always ensure `source ~/.nvm/nvm.sh && nvm use 24` before running npm commands in a new shell.

### Key commands
All scripts are documented in `README.md` → "Development" section and in `package.json`.
- `npm run dev` — Vite dev server on port 3000
- `npm run verify` — full CI pipeline: content generation → content tests → typecheck → build → Playwright e2e
- `npm run typecheck` — TypeScript strict checking (`tsc --noEmit`)
- `npm run test` — Playwright e2e tests (auto-starts Vite on port 8080)
- `npm run test:content` — Node.js built-in test runner for content index validation

### Content generation
`npm run generate:content` runs automatically as a `predev` and `prebuild` hook. It generates `public/content-index.json`, `feed.xml`, `logs/index.html`, and `topics/*/index.html` from `src/content/posts.ts`. If you modify post metadata, run `npm run generate:content` to regenerate derived files.

### Playwright tests
Playwright uses Chromium only. The test config (`playwright.config.ts`) launches a Vite server on port 8080 automatically. The `pretest` hook runs content generation and content tests before Playwright.

### No dedicated linter
There is no ESLint/Prettier config. TypeScript strict mode (`tsc --noEmit`) is the primary static analysis tool.
