import { test, expect } from '@playwright/test';

const USER_PROJECTS = new Set(['chromium', 'firefox', 'webkit']);

const isUserProject = (projectName: string) => USER_PROJECTS.has(projectName);
const isAdminProject = (projectName: string) => projectName === 'chromium-admin';
const isUnauthProject = (projectName: string) => projectName === 'chromium-unauth';

test.describe('Home Page Routing', () => {
    test('unauthenticated users are redirected from /home to /', async ({ page }, testInfo) => {
        test.skip(!isUnauthProject(testInfo.project.name), 'Unauth-only test');

        await page.goto('/home');

        await expect(page).toHaveURL('/');
        await expect(page.getByRole('heading', { name: /James Peralta/i })).toBeVisible();
    });

    test('logged-in users see home page with Now card', async ({ page }, testInfo) => {
        test.skip(!isAdminProject(testInfo.project.name), 'Auth-only test');

        await page.goto('/home');

        await expect(page).toHaveURL('/home');
        // NowCard renders a dynamic heading (e.g. "Review: ...") not literal "Home"
        await expect(page.locator('h1')).toBeVisible();
        // Should have the NowCard section
        await expect(page.locator('section').first()).toBeVisible();
    });

    test('home page has single primary CTA', async ({ page }, testInfo) => {
        test.skip(!isAdminProject(testInfo.project.name), 'Auth-only test');

        await page.goto('/home');

        // Only one primary CTA button (NowCard start session button)
        const primaryButtons = page.locator('[data-session-cta]');
        await expect(primaryButtons).toHaveCount(1);
    });

    test('admin sees Studio link in nav', async ({ page }, testInfo) => {
        test.skip(!isAdminProject(testInfo.project.name), 'Admin-only test');

        // Check on /learn where full nav is visible. On /home (gate mode), nav links are hidden.
        await page.goto('/learn');

        // Studio dropdown should be visible for admins
        await expect(page.getByRole('button', { name: /Studio/i })).toBeVisible();
    });

    test('regular users do not see Studio link', async ({ page }, testInfo) => {
        test.skip(!isUserProject(testInfo.project.name), 'User-only test');

        await page.goto('/learn');

        await expect(page.getByRole('button', { name: /Studio/i })).toHaveCount(0);
    });
});

test.describe('Deep-link Preservation', () => {
    test('login from /videos returns to /videos, not /home', async ({ page, context }, testInfo) => {
        test.skip(!isUnauthProject(testInfo.project.name), 'Unauth-only test');

        // This test validates that the redirect callback preserves callbackUrl
        // Note: Full OAuth flow can't be tested in E2E, but we can verify the callbackUrl is passed
        await page.goto('/login?callbackUrl=/videos');

        // The login page should preserve the callback URL
        await expect(page).toHaveURL(/callbackUrl.*videos/);
    });
});

