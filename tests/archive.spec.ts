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
