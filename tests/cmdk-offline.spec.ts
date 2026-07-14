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

test('command palette opens with meta+k and navigates to archive', async ({ page }) => {
  await page.keyboard.press('Meta+k');
  const palette = page.locator('clanka-cmdk .palette');
  await expect(palette).toBeVisible();

  const input = palette.locator('input');
  await expect(input).toBeFocused();
  await input.fill('archive');

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/logs/');
  await expect(page.locator('#archive-search-input')).toBeVisible();
});

test('task board shows empty state when API returns no tasks', async ({ page }) => {
  const tasks = page.locator('clanka-tasks#tasks');
  await expect(tasks).toBeVisible();
  await expect(tasks).toContainText('[ no tasks ]');
});

test('fleet widget renders mocked repo cards', async ({ page }) => {
  const fleet = page.locator('clanka-fleet#fleet');
  await fleet.scrollIntoViewIfNeeded();
  await expect(fleet.locator('.repo')).toHaveCount(2);
  await expect(fleet.locator('.sync.live')).toBeVisible();
});

test('live widgets show offline state when API is unreachable', async ({ page }) => {
  await page.route(`${API_BASE}/**`, async (route) => {
    await route.abort('failed');
  });

  await page.reload();
  await page.waitForSelector('#stat-active-agents');

  await expect(page.locator('#stat-active-agents')).toHaveText('agents: offline');
  await expect(page.locator('clanka-agents#agents')).toContainText('[ api unreachable ]');
  await expect(page.locator('clanka-tasks#tasks')).toContainText('[ api unreachable ]');
  await expect(page.locator('clanka-terminal#terminal')).toContainText('[ offline — activity unavailable ]');

  await page.locator('#commit-feed').scrollIntoViewIfNeeded();
  await expect(page.locator('#commit-feed')).toContainText('// activity unavailable');
});

test('partial /now payloads do not wipe tasks or agents', async ({ page }) => {
  await page.route(`${API_BASE}/now`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: 'shipping bug-bash fixes',
        status: 'active',
        agents_active: 3,
        team: { alpha: { status: 'active' } },
        tasks: [{ id: 't1', title: 'Keep the board', status: 'todo' }],
      }),
    });
  });

  await page.reload();
  await page.waitForSelector('clanka-tasks#tasks');
  await expect(page.locator('clanka-tasks#tasks')).toContainText('Keep the board');
  await expect(page.locator('#stat-active-agents')).toHaveText('agents: 3 active');

  // Simulate a slim presence-only sync (as if /now omitted tasks/team).
  await page.evaluate(() => {
    const presence = document.getElementById('presence');
    presence?.dispatchEvent(
      new CustomEvent('sync-updated', {
        detail: { current: 'still shipping', status: 'active' },
      }),
    );
  });

  await expect(page.locator('clanka-tasks#tasks')).toContainText('Keep the board');
  await expect(page.locator('clanka-agents#agents')).toContainText('team: 1 member');
  await expect(page.locator('#stat-active-agents')).toHaveText('agents: 3 active');
});

test('transient sync-error after a successful sync keeps task boards visible', async ({ page }) => {
  await page.route(`${API_BASE}/now`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: 'stable',
        status: 'active',
        agents_active: 2,
        team: { alpha: { status: 'active' } },
        tasks: [{ id: 't1', title: 'Stay visible', status: 'todo' }],
      }),
    });
  });

  await page.reload();
  await expect(page.locator('clanka-tasks#tasks')).toContainText('Stay visible');

  await page.evaluate(() => {
    const presence = document.getElementById('presence');
    presence?.dispatchEvent(
      new CustomEvent('sync-error', {
        detail: { error: '[ api unreachable ]', hadSync: true },
      }),
    );
  });

  await expect(page.locator('clanka-tasks#tasks')).toContainText('Stay visible');
  await expect(page.locator('clanka-tasks#tasks')).not.toContainText('[ api unreachable ]');
  await expect(page.locator('#stat-active-agents')).toHaveText('agents: 2 active');
});

test('slim sync after offline clears latched agent offline state', async ({ page }) => {
  await page.route(`${API_BASE}/**`, async (route) => {
    await route.abort('failed');
  });
  await page.reload();
  await expect(page.locator('#stat-active-agents')).toHaveText('agents: offline');

  await page.unroute(`${API_BASE}/**`);
  await page.evaluate(() => {
    const presence = document.getElementById('presence');
    presence?.dispatchEvent(
      new CustomEvent('sync-updated', {
        detail: { current: 'recovered', status: 'active' },
      }),
    );
  });

  await expect(page.locator('#stat-active-agents')).toHaveText('agents: —');
  await expect(page.locator('clanka-tasks#tasks')).not.toContainText('[ api unreachable ]');
});

test('command palette exposes listbox semantics for results', async ({ page }) => {
  await page.keyboard.press('Meta+k');
  const palette = page.locator('clanka-cmdk .palette');
  await expect(palette).toBeVisible();
  await expect(palette.locator('#cmdk-listbox')).toHaveAttribute('role', 'listbox');
  await expect(palette.locator('[role="option"]').first()).toBeVisible();
  await expect(palette.locator('input')).toHaveAttribute('aria-controls', 'cmdk-listbox');
});
