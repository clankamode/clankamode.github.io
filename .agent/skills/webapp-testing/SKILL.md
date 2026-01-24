---
name: webapp-testing
description: Toolkit for testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing screenshots, and viewing browser logs.
---

# Web Application Testing

Test local web applications using Playwright scripts.

## Decision Tree

```
Is it static HTML?
├─ Yes → Read HTML file directly → Write Playwright script
└─ No (dynamic webapp) → Is server running?
    ├─ No → Start with npm run dev first
    └─ Yes → Reconnaissance-then-action:
        1. Navigate and wait for networkidle
        2. Take screenshot or inspect DOM
        3. Identify selectors from rendered state
        4. Execute actions
```

## Running Tests

This project uses Playwright for E2E tests:

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/block-editor.spec.ts

# Run with UI mode
npx playwright test --ui

# Debug a failing test
npx playwright test --debug
```

## Reconnaissance Pattern

```typescript
// 1. Wait for page to be ready
await page.goto('http://localhost:3000');
await page.waitForLoadState('networkidle');

// 2. Take screenshot for visual inspection
await page.screenshot({ path: 'debug.png', fullPage: true });

// 3. Discover selectors
const buttons = await page.locator('button').all();
console.log(buttons.map(b => b.textContent()));

// 4. Execute actions with discovered selectors
await page.click('button:has-text("Submit")');
```

## Common Pitfall

❌ **Don't** inspect DOM before `networkidle` on dynamic apps  
✅ **Do** always wait: `await page.waitForLoadState('networkidle')`

## Best Practices

- Use `headless: true` for CI
- Use descriptive selectors: `text=`, `role=`, CSS, or IDs
- Add appropriate waits: `waitForSelector()`, `waitForTimeout()`
- Always close browser when done
- Capture console logs for debugging:

```typescript
page.on('console', msg => console.log(msg.text()));
```

## Project Test Files

- `tests/block-editor.spec.ts` - Block editor functionality tests
- `playwright.config.ts` - Playwright configuration
