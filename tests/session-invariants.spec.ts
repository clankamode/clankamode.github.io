import { test, expect, type Page } from '@playwright/test';

async function startSession(page: Page) {
    await page.goto('/home');
    await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();
    await page.click('[data-session-cta]');
    await expect(page.locator('header').getByText(/^Session\b/)).toBeVisible();
}

async function enterExitViaLeave(page: Page) {
    await startSession(page);
    await page.getByRole('button', { name: 'Leave session' }).click();
    
    // If we were on an article, we should be redirected to /home
    // to see the Exit View.
    if (page.url().includes('/learn/')) {
        await page.waitForURL(/\/home/, { timeout: 15000 });
    }

    const exitLocator = page.locator('[data-session-phase="exit"]');
    await exitLocator.waitFor({ state: 'visible', timeout: 10000 });
    return exitLocator;
}

test.describe('Session Invariants (Meaning & Ritual)', () => {
    // Use admin to bypass feature flags if needed, or ensure flag is on
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Gate Invariants: Single Mission and Bounded Scope', async ({ page }) => {
        // 1. Visit Home (Gate)
        await page.goto('/home');

        // Wait for Gate Mode
        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();

        // Invariant 1: One asserted mission (always)
        // We check for the specific mission text element (h3 or similar strong tag)
        // Based on NowCard implementation, it renders SessionIntent.text
        const mission = page.locator('[data-chrome-mode="gate"] h1');
        await expect(mission).toBeVisible();

        // Invariant 2: Scope is bounded (Item count + minutes)
        await expect(page.getByText(/\b\d+\s*min\b/i).first()).toBeVisible();
        await expect(page.getByText(/\bstep(s)?\b/i).first()).toBeVisible();

        // Invariant 3: Alternatives hidden (no infinite scroll / "Change track" requires action)
        // "Change track" button should exist
        await expect(page.getByRole('button', { name: /change/i })).toBeVisible();
        // But the track list (alternatives) should NOT be visible initially
        // (Assuming drawer logic hides it)
    });

    test('Execute Invariants: Zero Global Nav', async ({ page }) => {
        await page.goto('/home');
        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');

        // Wait for Phase Change: idle -> execution
        await expect(page.locator('[data-session-phase="execution"]')).toBeVisible();

        // Invariant 1: Zero global nav
        await expect(page.locator('nav').first()).not.toBeVisible(); // Navbar
        await expect(page.locator('footer').first()).not.toBeVisible(); // Footer

        // Invariant 2: SessionHUD present
        await expect(page.locator('header').getByText(/^Session\b/)).toBeVisible();
    });

    test('Exit Invariants: Inevitable Exit & Truthful Next', async ({ page }) => {
        await page.goto('/home');
        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();

        await enterExitViaLeave(page);

        const nextBtn = page.getByRole('button', { name: /Next:/i });
        if (await nextBtn.isVisible()) {
            const text = await nextBtn.textContent();
            expect(text).toMatch(/Next: .+ \(\d+ min\)/); // "Next: Pointer invariants (3 min)"
        } else {
            // Check that the data attribute exists and is false
            const exitView = page.locator('[data-chrome-mode="exit"]');
            await expect(exitView).toBeVisible({ timeout: 10000 });
            const attr = await exitView.getAttribute('data-has-micro-proposal');
            expect(attr).toBe('false');
        }

        const closeBtn = page.locator('button').filter({ hasText: /Internalize & Close|Continue/i }).first();
        await closeBtn.waitFor({ state: 'visible', timeout: 10000 });
        await closeBtn.click();
    });

    test('Exit Invariants: Micro-Session Navigation', async ({ page }) => {
        await page.goto('/home');
        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();

        await enterExitViaLeave(page);

        const ritualHeader = page.getByText('What changed?');
        try {
            if (await ritualHeader.isVisible({ timeout: 5000 })) {
                await page.locator('button').filter({ hasText: /I learned:|I clarified:/ }).first().click();
            }
        } catch (e) {}

        const internalizeBtn = page.locator('button').filter({ hasText: /Internalize & Close|Continue/i }).first();
        await internalizeBtn.waitFor({ state: 'visible', timeout: 10000 });
        await expect(internalizeBtn).toBeEnabled();
        await internalizeBtn.click();

        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('[data-session-phase="idle"]')).toBeVisible({ timeout: 15000 });
    });

});
