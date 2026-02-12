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
        const sessionBadge = page.locator('header').getByText('Session', { exact: true });
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
        await expect(page.locator('header').getByText('Session', { exact: true })).toBeVisible();

        // 3. Verify Layout
        // The standard sidebar container has 'hidden lg:block' and 'sticky'.
        // This should NOT exist in Session mode.
        await expect(page.locator('aside.hidden.lg\\:block')).toHaveCount(0);

        // 4. Verify Drawer Interaction
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
        await expect(page.locator('header').getByText('Session', { exact: true })).toBeVisible();

        // 2. Leave session (click the explicit button in the header)
        await page.locator('header').getByRole('button', { name: 'Leave session', exact: true }).click();

        // 3. Verify Return to Gate (or Home)
        await expect(page).toHaveURL('/home');

        // Chrome should be back
        await expect(page.locator('nav')).toBeVisible();
    });
});
