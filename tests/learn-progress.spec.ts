import { test, expect } from '@playwright/test';

const USER_PROJECTS = new Set(['chromium', 'firefox', 'webkit']);

const isUserProject = (projectName: string) => USER_PROJECTS.has(projectName);
const isAdminProject = (projectName: string) => projectName === 'chromium-admin';

test.describe('Learn Progress Gating', () => {
  test('regular users do not see progress entry points', async ({ page }, testInfo) => {
    test.skip(!isUserProject(testInfo.project.name), 'User-only test');

    await page.goto('/learn');

    await expect(page.getByRole('link', { name: 'View Dashboard' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'My Progress' })).toHaveCount(0);
  });

  test('regular users are redirected away from progress dashboard', async ({ page }, testInfo) => {
    test.skip(!isUserProject(testInfo.project.name), 'User-only test');

    await page.goto('/learn/progress');

    await expect(page).toHaveURL(/\/learn$/);
    await expect(page.getByRole('heading', { name: /Stay deliberate/i })).toHaveCount(0);
  });

  test('admins see progress entry points and dashboard', async ({ page }, testInfo) => {
    test.skip(!isAdminProject(testInfo.project.name), 'Admin-only test');

    await page.goto('/learn');

    await expect(page.getByRole('link', { name: 'View Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Progress' })).toBeVisible();

    await page.getByRole('link', { name: 'View Dashboard' }).click();
    await expect(page).toHaveURL(/\/learn\/progress$/);
    await expect(page.getByRole('heading', { name: /Stay deliberate/i })).toBeVisible();
  });
});
