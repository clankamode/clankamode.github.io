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
          totalRepos: 42,
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
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveText('theme: light');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await page.reload();
  await page.waitForSelector('#homepage-featured-log .featured-log');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#theme-toggle')).toHaveText('theme: light');
  await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-pressed', 'false');

  await page.evaluate(() => window.localStorage.setItem('clanka-theme', 'dark'));
});

test('homepage logs section links into archive and renders generated topic chips', async ({ page }) => {
  await expect(page.locator('#stat-posts')).not.toHaveText('... posts');
  await expect(page.locator('#stat-posts')).toContainText('posts');
  await expect(page.locator('#homepage-log-preview .row')).toHaveCount(5);
  await expect(page.locator('#homepage-topic-preview .topic-chip')).toHaveCount(6);
  await expect(page.locator('#logs-archive-link-count')).toContainText('dispatches');

  await page.locator('.archive-cta').click();
  await expect(page).toHaveURL('/logs/');
  await expect(page.locator('#archive-search-input')).toBeVisible();
});

test('homepage does not mount a duplicate activity widget', async ({ page }) => {
  await expect(page.locator('clanka-activity')).toHaveCount(0);
  await expect(page.locator('#commit-feed')).toBeVisible();
});

test('active agent stat is populated from live now payload', async ({ page }) => {
  await expect(page.locator('#stat-active-agents')).toHaveText('agents: 7 active');
  await expect(page.locator('#status-live-label')).toHaveText('LIVE');
});

test('homepage repo stats are populated from mocked API responses', async ({ page }) => {
  await expect(page.locator('#stat-repos')).toHaveText('16 repos');
  await expect(page.locator('#stat-fleet-score')).toHaveText('fleet: 42 repos');
});

test('homepage commit feed renders recent GitHub activity', async ({ page }) => {
  const commitFeed = page.locator('#commit-feed');

  await expect(commitFeed.locator('.commit-item')).toHaveCount(1);
  await expect(commitFeed.locator('.commit-repo')).toHaveText('site');
  await expect(commitFeed.locator('.commit-tag')).toHaveText('feat');
  await expect(commitFeed).not.toContainText('// no activity data');
});

test('homepage archive stats show unavailable when content-index fails', async ({ page }) => {
  await page.route('**/content-index.json', async (route) => {
    await route.fulfill({ status: 500, contentType: 'text/plain', body: 'boom' });
  });

  await page.reload();
  await page.locator('.logs-section').scrollIntoViewIfNeeded();
  await expect(page.locator('#homepage-featured-log')).toContainText('archive unavailable');
  await expect(page.locator('#stat-posts')).toHaveText('archive unavailable');
  await expect(page.locator('#stat-audio-posts')).toHaveText('audio unavailable');
  await expect(page.locator('#logs-archive-link-count')).toHaveText('archive unavailable');
});
