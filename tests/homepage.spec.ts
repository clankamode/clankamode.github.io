import { test, expect, type Page } from '@playwright/test';

const API_BASE = 'https://clanka-api.clankamode.workers.dev';

async function mockApiResponses(page: Page): Promise<void> {
  await page.route(`${API_BASE}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname === '/github/stats') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repoCount: 16,
          totalStars: 120,
          lastPushedAt: '2026-03-03T03:30:00.000Z',
          lastPushedRepo: 'clankamode/site',
        }),
      });
      return;
    }

    if (pathname === '/fleet/score') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ score: 92 }),
      });
      return;
    }

    if (pathname === '/now') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          current: 'building homepage improvements',
          status: 'active',
          agents_active: 7,
          history: [],
          team: {},
          tasks: [],
        }),
      });
      return;
    }

    if (pathname === '/fleet/summary') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repos: [
            { repo: 'clankamode/ci-failure-triager', tier: 'ops', criticality: 'critical', online: true },
            { repo: 'clankamode/clanka-api', tier: 'core', criticality: 'high', online: true },
          ],
        }),
      });
      return;
    }

    if (pathname === '/github/events') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            repo: 'clankamode/site',
            pushedAt: '2026-03-03T03:40:00.000Z',
            commits: [{ message: 'feat: improve homepage', sha: 'abc1234' }],
          },
        ]),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'not found' }),
    });
  });

  await page.route('https://api.npmjs.org/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ downloads: 1234 }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('clanka-theme')) {
      window.localStorage.setItem('clanka-theme', 'dark');
    }
  });

  await mockApiResponses(page);
  await page.goto('/');
  await page.waitForSelector('#posts-search-input');
});

test('theme toggle persists after reload', async ({ page }) => {
  const toggle = page.locator('#theme-toggle');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveText('theme: dark');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveText('theme: light');

  await page.reload();
  await page.waitForSelector('#posts-search-input');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#theme-toggle')).toHaveText('theme: light');
});

test('logs search filters rows and supports keyboard focus', async ({ page }) => {
  const searchInput = page.locator('#posts-search-input');

  await page.keyboard.press('/');
  await expect(searchInput).toBeFocused();

  await searchInput.fill('spark');
  const visibleRows = page.locator('#logs-list .row:not([hidden])');
  await expect(visibleRows).toHaveCount(1);
  await expect(visibleRows.first().locator('.row-name a')).toContainText('Spark');
  await expect(page.locator('#posts-search-count')).toHaveText('1 match');

  await searchInput.press('ArrowDown');
  await expect(visibleRows.first().locator('.row-name a')).toBeFocused();
});

test('active agent stat is populated from live now payload', async ({ page }) => {
  await expect(page.locator('#stat-active-agents')).toHaveText('agents: 7 active');
});
