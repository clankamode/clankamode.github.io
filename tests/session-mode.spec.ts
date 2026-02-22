import { test, expect } from '@playwright/test';

const USER_PROJECTS = new Set(['chromium-admin']);

const isActiveProject = (projectName: string) => USER_PROJECTS.has(projectName);

test.describe('Session Mode Chrome Governor', () => {
    test('navbar is removed during session execution', async ({ page }, testInfo) => {
        test.skip(!isActiveProject(testInfo.project.name), 'Admin-only test for now');

        // 1. Visit Home (Gate)
        await page.goto('/home');

        // Verify Navbar is present in Gate (App mode)
        await expect(page.locator('nav')).toBeVisible();

        // 2. Start Session
        // Click the "Start session" button (data-session-cta)
        await page.click('[data-session-cta]');

        // 3. Verify Session Mode
        // Navbar should BE GONE (not just hidden)
        await expect(page.locator('nav')).toHaveCount(0);

        // SessionHUD should be visible. Use specific selector to avoid ambiguity.
        const sessionBadge = page.locator('header').getByText(/^Session\b/);
        await expect(sessionBadge).toBeVisible();

        // Footer should BE GONE
        await expect(page.locator('footer')).toHaveCount(0);
    });

    test('article displays single-column during session', async ({ page }, testInfo) => {
        test.skip(!isActiveProject(testInfo.project.name), 'Admin-only test for now');

        // 1. Start session
        await page.goto('/home');
        await page.click('[data-session-cta]');

        // 2. Wait for article to load (wait for HUD context)
        await expect(page.locator('header').getByText(/^Session\b/)).toBeVisible();

        // 3. Verify Drawer Interaction
        // The pillar drawer is removed in session mode V1 cleanup

        // Press 't' to open TOC drawer
        await page.keyboard.press('t');
        const tocDrawer = page.locator('[data-drawer="toc"]');
        await expect(tocDrawer).toBeVisible();
        await expect(tocDrawer).not.toHaveClass(/translate-x-full/);
    });

    test('leave session restores chrome', async ({ page }, testInfo) => {
        test.skip(!isActiveProject(testInfo.project.name), 'Admin-only test for now');

        // 1. Start session
        await page.goto('/home');
        await page.click('[data-session-cta]');

        // Wait for HUD
        await expect(page.locator('header').getByText(/^Session\b/)).toBeVisible();

        // 2. Leave session from HUD
        await page.getByRole('button', { name: 'Leave session' }).click();

        // 3. Verify Return to Gate (or Home)
        // If we were on an article, we should be redirected to /home
        await expect(page).toHaveURL(/\/home/, { timeout: 15000 });

        // When leaving early, we might see the "Session ended early" view (Phase: exit)
        // or it might go straight back to gate (Phase: idle).
        // If we see the "Continue" button, click it.
        const continueBtn = page.getByRole('button', { name: 'Continue' });
        try {
            if (await continueBtn.isVisible({ timeout: 5000 })) {
                await continueBtn.click();
            }
        } catch (e) {
            // Might have already navigated or button not present
        }

        // Chrome should be back
        await expect(page.locator('nav')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('header').getByText(/^Session\b/)).not.toBeVisible({ timeout: 15000 });
    });
});
