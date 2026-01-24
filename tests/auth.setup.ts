import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/auth/test-session') && resp.status() === 200,
    { timeout: 10000 }
  );
  
  await page.goto('/api/auth/test-session?email=test@example.com&role=USER&name=Test User');
  
  const response = await responsePromise;
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.email).toBe('test@example.com');
  
  await page.context().storageState({ 
    path: 'playwright/.auth/user.json' 
  });
});

setup('authenticate as admin', async ({ page }) => {
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/auth/test-session') && resp.status() === 200,
    { timeout: 10000 }
  );
  
  await page.goto('/api/auth/test-session?email=admin@example.com&role=ADMIN&name=Admin User');
  
  const response = await responsePromise;
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.role).toBe('ADMIN');
  
  await page.context().storageState({ 
    path: 'playwright/.auth/admin.json' 
  });
});
