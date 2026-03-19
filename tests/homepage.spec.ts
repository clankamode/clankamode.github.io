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
        body: JSON.stringify({
          events: [
            {
              type: 'PushEvent',
              repo: 'clankamode/site',
              message: 'feat: improve homepage',
              timestamp: '2026-03-03T03:40:00.000Z',
            },
          ],
        }),
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
  await page.waitForSelector('#homepage-featured-log .featured-log');
});

test('theme toggle persists after reload', async ({ page }) => {
  const toggle = page.locator('#theme-toggle');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveText('theme: dark');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveText('theme: light');

  await page.reload();
  await page.waitForSelector('#homepage-featured-log .featured-log');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#theme-toggle')).toHaveText('theme: light');
});

test('homepage logs section links into archive and renders generated topic chips', async ({ page }) => {
  await expect(page.locator('#homepage-log-preview .row')).toHaveCount(5);
  await expect(page.locator('#homepage-topic-preview .topic-chip')).toHaveCount(6);
  await expect(page.locator('#logs-archive-link-count')).toContainText('dispatches');

  await page.locator('.archive-cta').click();
  await expect(page).toHaveURL('/logs/');
  await expect(page.locator('#archive-search-input')).toBeVisible();
});

test('active agent stat is populated from live now payload', async ({ page }) => {
  await expect(page.locator('#stat-active-agents')).toHaveText('agents: 7 active');
});

test('homepage commit feed renders recent GitHub activity', async ({ page }) => {
  const commitFeed = page.locator('#commit-feed');

  await expect(commitFeed.locator('.commit-item')).toHaveCount(1);
  await expect(commitFeed.locator('.commit-repo')).toHaveText('site');
  await expect(commitFeed.locator('.commit-tag')).toHaveText('feat');
  await expect(commitFeed).not.toContainText('// no activity data');
});
