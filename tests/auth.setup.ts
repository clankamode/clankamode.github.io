import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }, testInfo) => {
  setup.skip(testInfo.project.name === 'setup-admin');
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/auth/test-session') && resp.status() === 200,
    { timeout: 10000 }
  );

  await page.goto('/api/auth/test-session?email=e2e-user@example.com&role=USER&name=E2E User');

  const response = await responsePromise;
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.email).toBe('e2e-user@example.com');

  await page.context().storageState({
    path: 'playwright/.auth/user.json'
  });
});

setup('authenticate as admin', async ({ page }, testInfo) => {
  setup.skip(testInfo.project.name === 'setup');
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/auth/test-session') && resp.status() === 200,
    { timeout: 10000 }
  );

  await page.goto('/api/auth/test-session?email=e2e-admin@example.com&role=ADMIN&name=E2E Admin');

  const response = await responsePromise;
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.role).toBe('ADMIN');

  await page.context().storageState({
    path: 'playwright/.auth/admin.json'
  });
});
