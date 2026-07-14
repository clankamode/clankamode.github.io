import { test, expect, type Page } from '@playwright/test';

type ContentIndex = {
  posts: Array<{
    title: string;
    audio: boolean;
  }>;
  topics: Array<{
    slug: string;
    count: number;
    latestDate: string | null;
    posts: Array<{
      title: string;
    }>;
  }>;
};

function formatDispatchCount(count: number): string {
  return `${count} ${count === 1 ? 'dispatch' : 'dispatches'}`;
}

function requireValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

async function loadContentIndex(page: Page): Promise<ContentIndex> {
  const response = await page.request.get('/content-index.json');
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as ContentIndex;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('clanka-theme')) {
      window.localStorage.setItem('clanka-theme', 'dark');
    }
  });
});

test('archive supports text and format filtering', async ({ page }) => {
  const contentIndex = await loadContentIndex(page);
  const searchablePost = requireValue(contentIndex.posts[0], 'expected at least one archive post');
  const listenPosts = contentIndex.posts.filter((post) => post.audio);
  const firstReadOnlyPost = requireValue(
    contentIndex.posts.find((post) => !post.audio),
    'expected at least one read-only archive post',
  );

  expect(listenPosts.length).toBeGreaterThan(0);

  await page.goto('/logs/');
  await page.waitForSelector('#archive-search-input');

  const results = page.locator('#archive-results .archive-card');

  await page.locator('#archive-search-input').fill(searchablePost.title);
  await expect(results).toHaveCount(1);
  await expect(results.first().locator('.archive-card-title')).toContainText(searchablePost.title);

  await page.locator('#archive-search-input').fill('');
  await page.getByRole('button', { name: 'listen' }).click();
  await expect(page.locator('#archive-results-count')).toHaveText(`${formatDispatchCount(listenPosts.length)} shown`);
  await expect(results).toHaveCount(listenPosts.length);
  await expect(results.first().locator('.archive-meta-badge').nth(1)).toContainText('listen available');
  await expect(page.locator('#archive-results')).not.toContainText(firstReadOnlyPost.title);
});

test('archive topic filter narrows results to matching dispatches', async ({ page }) => {
  const contentIndex = await loadContentIndex(page);
  const topic = requireValue(
    contentIndex.topics.find((entry) => entry.slug === 'philosophy'),
    'expected generated content for the philosophy topic',
  );

  await page.goto('/logs/');
  await page.waitForSelector('#archive-topic-select');

  await page.locator('#archive-topic-select').selectOption('philosophy');
  await expect(page.locator('#archive-results-count')).toHaveText(formatDispatchCount(topic.count) + ' shown');
  await expect(page.locator('#archive-results .archive-card')).toHaveCount(topic.count);
});

test('archive search with no matches shows an empty state message', async ({ page }) => {
  await page.goto('/logs/');
  await page.waitForSelector('#archive-search-input');

  await page.locator('#archive-search-input').fill('zzznomatchzzz');
  await expect(page.locator('#archive-results-count')).toHaveText('0 dispatches shown');
  await expect(page.locator('#archive-results')).toHaveText('no dispatches match these filters');
  await expect(page.locator('#archive-results .archive-card')).toHaveCount(0);
});

test('topic pages show derived counts and matching posts', async ({ page }) => {
  const contentIndex = await loadContentIndex(page);
  const topic = requireValue(
    contentIndex.topics.find((entry) => entry.slug === 'agents'),
    'expected generated content for the agents topic',
  );

  await page.goto('/topics/agents/');
  await page.waitForSelector('#topic-count');

  await expect(page.locator('#topic-count')).toHaveText(formatDispatchCount(topic.count));
  await expect(page.locator('#topic-latest')).toHaveText(
    topic.latestDate ? `last dispatch · ${topic.latestDate}` : 'last dispatch · n/a',
  );
  await expect(page.locator('#topic-posts .archive-card')).toHaveCount(topic.posts.length);
  await expect(page.locator('#topic-posts .archive-card').first().locator('.archive-card-title')).toContainText(
    requireValue(topic.posts[0], 'expected at least one post for the agents topic').title,
  );
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

test('post j/k keyboard navigation follows enhanced prev/next links', async ({ page }) => {
  await page.goto('/posts/2026-03-11-the-reversibility-test.html');
  await page.waitForSelector('.post-nav-enhanced a[data-nav]');

  const nextHref = await page.locator('.post-nav-enhanced a[data-nav="next"]').getAttribute('href');
  expect(nextHref).toBeTruthy();

  await page.keyboard.press('j');
  await expect(page).toHaveURL(nextHref!);

  await page.waitForSelector('.post-nav-enhanced a[data-nav="prev"]');
  const prevHref = await page.locator('.post-nav-enhanced a[data-nav="prev"]').getAttribute('href');
  expect(prevHref).toBeTruthy();

  await page.keyboard.press('k');
  await expect(page).toHaveURL(prevHref!);
});

test('404 page is a dedicated not-found shell', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('h1')).toHaveText('404');
  await expect(page.locator('main')).toContainText('No dispatch at this path');
  await expect(page.locator('body')).not.toContainText('I build systems');
  await expect(page.getByRole('link', { name: 'home' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'archive' })).toBeVisible();
});

test('archive status bar does not claim LIVE telemetry', async ({ page }) => {
  await page.goto('/logs/');
  await page.waitForSelector('#archive-search-input');
  await expect(page.locator('#status-live-label')).toHaveText('SITE');
});
