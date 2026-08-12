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

test('command palette restores skip-link tab order after close', async ({ page }) => {
  const skip = page.locator('.skip-link');
  await expect(skip).toBeVisible();
  await expect(skip).not.toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('Meta+k');
  await expect(page.locator('clanka-cmdk .palette')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('clanka-cmdk .palette')).toHaveCount(0);

  await expect(skip).not.toHaveAttribute('tabindex', '-1');
  // Permanent skip-link target must be restored after cmdk clears inert chrome.
  await expect(page.locator('#main-content')).toHaveAttribute('tabindex', '-1');
});

test('command palette Work nav from archive routes home', async ({ page }) => {
  await page.goto('/logs/');
  // Host is empty when closed; wait for attachment, not visibility.
  await page.waitForSelector('clanka-cmdk', { state: 'attached' });

  await page.keyboard.press('Meta+k');
  const palette = page.locator('clanka-cmdk .palette');
  await expect(palette).toBeVisible();

  const input = palette.locator('input');
  await input.fill('work');
  // Prefer the section nav item (href /#work-label), not a post titled something with "work".
  await page.evaluate(() => {
    const host = document.querySelector('clanka-cmdk') as HTMLElement & {
      shadowRoot: ShadowRoot | null;
    };
    const option = Array.from(host.shadowRoot?.querySelectorAll('.item') ?? []).find((el) =>
      el.querySelector('.item-label')?.textContent?.trim() === 'Work',
    ) as HTMLElement | undefined;
    option?.click();
  });

  await expect(page).toHaveURL(/\/#work-label$/);
});

test('task board shows empty state when API returns no tasks', async ({ page }) => {
  const tasks = page.locator('clanka-tasks#tasks');
  await expect(tasks).toBeVisible();
  await expect(tasks).toContainText('[ no tasks ]');
});

test('task board drops non-object items and maps in_progress status', async ({ page }) => {
  await page.route(`${API_BASE}/now`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: 'triaging tasks',
        status: 'active',
        tasks: [
          null,
          'skip-me',
          { title: 'Ship the board', status: 'in_progress', assignee: 'clanka', priority: 1 },
          { title: { nested: true }, status: 'todo' },
          { title: 'Wait on review', status: 'blocked', priority: 'P2' },
          { title: 'Docs pass', status: 'todo', priority: 'high' },
        ],
      }),
    });
  });

  await page.reload();
  const tasks = page.locator('clanka-tasks#tasks');
  await expect(tasks).toContainText('Ship the board');
  await expect(tasks.locator('.task-card')).toHaveCount(4);
  await expect(tasks.locator('.status-doing')).toHaveCount(1);
  await expect(tasks.locator('.status-doing')).toHaveText('DOING');
  await expect(tasks.locator('.status-blocked')).toHaveText('BLOCKED');
  await expect(tasks).toContainText('P1');
  await expect(tasks).toContainText('P2');
  await expect(tasks).toContainText('high');
  await expect(tasks).not.toContainText('Phigh');
  await expect(tasks).not.toContainText('PP2');
  await expect(tasks).not.toContainText('[object Object]');
  await expect(tasks).toContainText('untitled');
});

test('fleet widget renders mocked repo cards', async ({ page }) => {
  const fleet = page.locator('clanka-fleet#fleet');
  await fleet.scrollIntoViewIfNeeded();
  await expect(fleet.locator('.repo')).toHaveCount(2);
  await expect(fleet.locator('.sync.live')).toBeVisible();
  await expect(fleet.locator('.status-pill.online')).toHaveCount(2);
});

test('fleet treats all-invalid repo entries as unavailable not empty', async ({ page }) => {
  await page.route(`${API_BASE}/fleet/summary`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        repos: [
          { repo: 'clankamode/broken', tier: 'not-a-tier', criticality: 'critical' },
          { name: '', tier: 'ops', criticality: 'high' },
          null,
        ],
      }),
    });
  });

  await page.reload();
  const fleet = page.locator('clanka-fleet#fleet');
  await fleet.scrollIntoViewIfNeeded();
  await expect(fleet.locator('.fallback')).toHaveText('[ fleet unavailable ]');
  await expect(fleet.locator('.sync')).toHaveText('OFFLINE');
  await expect(fleet.locator('.repo')).toHaveCount(0);
  await expect(fleet).not.toContainText('[ fleet registry empty ]');
});

test('fleet hides status pill when API omits online state', async ({ page }) => {
  await page.route(`${API_BASE}/fleet/summary`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalRepos: 2,
        repos: [
          { repo: 'clankamode/ci-failure-triager', tier: 'ops', criticality: 'critical' },
          { repo: 'clankamode/clanka-api', tier: 'core', criticality: 'high' },
        ],
      }),
    });
  });

  await page.reload();
  const fleet = page.locator('clanka-fleet#fleet');
  await fleet.scrollIntoViewIfNeeded();
  await expect(fleet.locator('.repo')).toHaveCount(2);
  await expect(fleet.locator('.status-pill')).toHaveCount(0);
  await expect(fleet.locator('.sync.synced')).toBeVisible();
});

test('terminal normalizes event types and blank messages', async ({ page }) => {
  await page.route(`${API_BASE}/github/events`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        events: [
          {
            type: 'PR',
            repo: 'clankamode/site',
            message: '   ',
            timestamp: '2026-03-03T03:40:00.000Z',
          },
          {
            type: 'PUSH',
            repo: 'clankamode/api',
            message: 'ship it',
            timestamp: '2026-03-03T03:41:00.000Z',
          },
        ],
      }),
    });
  });

  await page.reload();
  const terminal = page.locator('clanka-terminal#terminal');
  await terminal.scrollIntoViewIfNeeded();
  await expect(terminal.locator('.tag').first()).toHaveText('[pr]');
  await expect(terminal.locator('.msg').first()).toHaveText('"—"');
  await expect(terminal.locator('.tag').nth(1)).toHaveText('[push]');
  await expect(terminal.locator('.terminal')).toHaveAttribute('aria-busy', 'false');
});

test('malformed github events show unavailable instead of empty activity', async ({ page }) => {
  await page.route(`${API_BASE}/github/events`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'token expired' }),
    });
  });

  await page.reload();
  await page.locator('#commit-feed').scrollIntoViewIfNeeded();
  await expect(page.locator('#commit-feed')).toContainText('// activity unavailable');

  await page.locator('clanka-terminal#terminal').scrollIntoViewIfNeeded();
  await expect(page.locator('clanka-terminal#terminal')).toContainText(
    '[ offline — activity unavailable ]',
  );
});

test('all-invalid github event items show unavailable instead of empty activity', async ({ page }) => {
  await page.route(`${API_BASE}/github/events`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        events: [
          { type: 'PUSH', repo: '', message: 'push', timestamp: '2026-08-06T23:07:47Z' },
          { foo: 'bar' },
        ],
      }),
    });
  });

  await page.reload();
  await page.locator('#commit-feed').scrollIntoViewIfNeeded();
  await expect(page.locator('#commit-feed')).toContainText('// activity unavailable');
  await expect(page.locator('#commit-feed')).not.toContainText('// no recent activity');

  await page.locator('clanka-terminal#terminal').scrollIntoViewIfNeeded();
  await expect(page.locator('clanka-terminal#terminal')).toContainText(
    '[ offline — activity unavailable ]',
  );
  await expect(page.locator('clanka-terminal#terminal')).not.toContainText('[ no recent activity ]');
});

test('live widgets show offline state when API is unreachable', async ({ page }) => {
  await page.route(`${API_BASE}/**`, async (route) => {
    await route.abort('failed');
  });

  await page.reload();
  await page.waitForSelector('#stat-active-agents');

  await expect(page.locator('#stat-active-agents')).toHaveText('agents: offline');
  await expect(page.locator('#status-live-label')).toHaveText('OFFLINE');
  await expect(page.locator('clanka-agents#agents')).toContainText('[ api unreachable ]');
  await expect(page.locator('clanka-tasks#tasks')).toContainText('[ api unreachable ]');

  await page.locator('clanka-terminal#terminal').scrollIntoViewIfNeeded();
  await expect(page.locator('clanka-terminal#terminal')).toContainText('[ offline — activity unavailable ]');

  await page.locator('#commit-feed').scrollIntoViewIfNeeded();
  await expect(page.locator('#commit-feed')).toContainText('// activity unavailable');
});

test('github events offline path coalesces retries across terminal and commit feed', async ({ page }) => {
  let eventsHits = 0;
  await page.route(`${API_BASE}/github/events`, async (route) => {
    eventsHits += 1;
    await route.abort('failed');
  });

  await page.reload();
  await page.locator('#commit-feed').scrollIntoViewIfNeeded();
  await page.locator('clanka-terminal#terminal').scrollIntoViewIfNeeded();
  await expect(page.locator('#commit-feed')).toContainText('// activity unavailable');
  await expect(page.locator('clanka-terminal#terminal')).toContainText(
    '[ offline — activity unavailable ]',
  );

  // One shared retry chain (≤3), not 3 attempts × each widget.
  expect(eventsHits).toBeGreaterThan(0);
  expect(eventsHits).toBeLessThanOrEqual(3);
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
  // Status chrome should mirror presence STALE, not jump to OFFLINE after a prior sync.
  await expect(page.locator('#status-live-label')).toHaveText('STALE');
});

test('presence announces status via aria-live and rejects blank current', async ({ page }) => {
  await page.route(`${API_BASE}/now`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: '   ',
        status: 'thinking',
        agents_active: 1,
      }),
    });
  });

  await page.reload();
  const presence = page.locator('clanka-presence#presence');
  await expect(presence.locator('.hd-status')).toHaveAttribute('aria-live', 'polite');
  await expect(presence.locator('.presence-block')).toHaveAttribute('aria-live', 'polite');
  // Blank current falls back on first sync; status still applies.
  await expect(presence.locator('.hd-status')).toContainText('THINKING');
  await expect(presence.locator('.presence-block')).toContainText('active');
  await expect(presence.locator('.presence-block')).not.toContainText('[ api unreachable ]');
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

test('command palette marks page chrome inert while open', async ({ page }) => {
  await page.keyboard.press('Meta+k');
  await expect(page.locator('clanka-cmdk .palette')).toBeVisible();
  await expect(page.locator('#main-content')).toHaveAttribute('inert', '');
  await expect(page.locator('#theme-toggle')).toHaveAttribute('inert', '');

  await page.keyboard.press('Escape');
  await expect(page.locator('clanka-cmdk .palette')).toHaveCount(0);
  await expect(page.locator('#main-content')).not.toHaveAttribute('inert');
});

test('command palette syncs aria-expanded on the open trigger', async ({ page }) => {
  const hint = page.locator('.cmdk-hint');
  await expect(hint).toHaveAttribute('aria-expanded', 'false');
  await expect(hint).toHaveAttribute('aria-haspopup', 'dialog');

  await page.keyboard.press('Meta+k');
  await expect(page.locator('clanka-cmdk .palette')).toBeVisible();
  await expect(hint).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect(page.locator('clanka-cmdk .palette')).toHaveCount(0);
  await expect(hint).toHaveAttribute('aria-expanded', 'false');
});

test('command palette re-open does not leave body scroll locked after close', async ({ page }) => {
  await page.evaluate(() => {
    document.body.style.overflow = '';
    const host = document.querySelector('clanka-cmdk') as HTMLElement & {
      openPalette?: () => void;
    };
    host.openPalette?.();
    host.openPalette?.();
  });

  await expect(page.locator('clanka-cmdk .palette')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

  await page.keyboard.press('Escape');
  await expect(page.locator('clanka-cmdk .palette')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
});
