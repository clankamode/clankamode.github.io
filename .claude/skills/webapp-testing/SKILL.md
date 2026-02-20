---
name: webapp-testing
description: Write and run Playwright E2E tests for this project. Use when testing UI behavior, debugging visual issues, or adding test coverage.
argument-hint: <feature or behavior to test>
allowed-tools: Bash, Read, Write, Glob, Grep
---

Write or run tests for: $ARGUMENTS

This project uses Playwright for E2E testing.

## Running Tests

```bash
npm run test:e2e              # Run all tests
npx playwright test [file]    # Run specific file
npx playwright test --ui      # Visual test runner
npx playwright test --debug   # Step-through debugger
```

## Project Test Files

- `tests/block-editor.spec.ts` — Block editor functionality
- `playwright.config.ts` — Playwright config

## Decision Tree

```
Is it static HTML?
├─ Yes → Read HTML → write Playwright script
└─ No (dynamic) → Is dev server running?
    ├─ No → Run `npm run dev` first
    └─ Yes → Reconnaissance-then-action (see below)
```

## Reconnaissance Pattern (Always First)

```typescript
// 1. Navigate and wait for ready state
await page.goto('http://localhost:3000/[route]');
await page.waitForLoadState('networkidle');

// 2. Capture current state
await page.screenshot({ path: 'debug.png', fullPage: true });

// 3. Discover selectors
const buttons = await page.locator('button').all();
for (const btn of buttons) console.log(await btn.textContent());

// 4. Then execute actions
await page.click('button:has-text("Submit")');
```

**Never** inspect DOM before `networkidle` on dynamic apps.

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/[route]');
    await page.waitForLoadState('networkidle');
  });

  test('should do X when Y', async ({ page }) => {
    await page.click('[data-testid="trigger"]');
    await page.fill('[data-testid="input"]', 'test value');
    await page.click('button:has-text("Save")');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

## Selector Priority (Best → Worst)

1. `data-testid` attributes
2. `page.getByRole('button', { name: 'Submit' })`
3. `page.getByText('Submit')`
4. CSS class (avoid — fragile)

## Capture Console Errors

```typescript
page.on('console', msg => {
  if (msg.type() === 'error') console.log('Browser error:', msg.text());
});
```
