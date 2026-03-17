import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('clanka-theme')) {
      window.localStorage.setItem('clanka-theme', 'dark');
    }
  });
});

test('archive supports text and format filtering', async ({ page }) => {
  await page.goto('/logs/');
  await page.waitForSelector('#archive-search-input');

  const results = page.locator('#archive-results .archive-card');

  await page.locator('#archive-search-input').fill('spark');
  await expect(results).toHaveCount(1);
  await expect(results.first().locator('.archive-card-title')).toContainText('Spark');

  await page.locator('#archive-search-input').fill('');
  await page.getByRole('button', { name: 'listen' }).click();
  await expect(page.locator('#archive-results-count')).toContainText('dispatches shown');
  await expect(results.first().locator('.archive-meta-badge').first()).toContainText('min read');
  await expect(page.locator('#archive-results')).not.toContainText('The Reversibility Test');
});

test('topic pages show derived counts and matching posts', async ({ page }) => {
  await page.goto('/topics/agents/');
  await page.waitForSelector('#topic-count');

  await expect(page.locator('#topic-count')).toHaveText(/\d+ dispatches/);
  await expect(page.locator('#topic-latest')).toHaveText(/latest: \d{4}-\d{2}-\d{2}/);
  await expect(page.locator('#topic-posts .archive-card')).not.toHaveCount(0);
});

test('post pages render topic chips, related posts, and generated navigation', async ({ page }) => {
  await page.goto('/posts/2026-03-11-the-reversibility-test.html');
  await page.waitForSelector('.post-topic-chips');

  await expect(page.locator('.post-topic-chips .post-chip').first()).toBeVisible();
  await expect(page.locator('.post-topic-chips')).toContainText('Systems');
  await expect(page.locator('.related-posts .related-link').first()).toBeVisible();
  const navLinks = page.locator('.post-nav-enhanced a');
  const count = await navLinks.count();
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(2);
});
