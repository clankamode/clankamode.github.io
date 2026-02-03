import { test, expect } from '@playwright/test';

// Test data constants
const PAGE_TITLE = 'James Peralta';
const HERO_FALLBACK_NAME = /JAMES\s*PERALTA/i;
const HERO_FALLBACK_DESCRIPTION = 'Deep dives into algorithms, system design, and problem-solving strategies for technical interviews.';

// Video section constants
const LATEST_VIDEOS = {
  title: 'Latest Videos',
  emptyTitle: 'No Latest Videos Found',
  emptyMessage: 'Please check your YouTube API key and channel ID in the .env.local file.',
  viewAllLink: '/videos'
};

const POPULAR_VIDEOS = {
  title: 'Popular Videos',
  emptyTitle: 'No Popular Videos Found',
  emptyMessage: 'Could not fetch popular videos at this time.'
};

test.describe('Homepage', () => {
  test('should display all main sections and handle both loaded and empty states', async ({ page }) => {
    await page.goto('/');

    // 1. Page title
    await expect(page).toHaveTitle(new RegExp(PAGE_TITLE));

    // 2. Hero Section
    const heroSection = page.getByRole('region', { name: 'Hero Section' });
    await expect(heroSection).toBeVisible();

    // Hero section elements
    await expect(heroSection.getByRole('heading', { level: 1 })).toContainText(HERO_FALLBACK_NAME);
    await expect(heroSection.getByText(HERO_FALLBACK_DESCRIPTION)).toBeVisible();

    // Hero section buttons
    const youtubeButton = heroSection.getByRole('link', { name: /Watch on YouTube/i });
    await expect(youtubeButton).toBeVisible();
    await expect(youtubeButton).toHaveAttribute('target', '_blank');
    await expect(youtubeButton).toHaveAttribute('rel', 'noopener noreferrer');

    const browseButton = heroSection.getByRole('link', { name: 'Explore Content' });
    await expect(browseButton).toBeVisible();
    await expect(browseButton).toHaveAttribute('href', '/videos');

    // 3. Videos Section (Tabbed)
    const videosSection = page.getByRole('region', { name: 'Videos' }).or(page.locator('section').filter({ hasText: 'Videos' }));
    await expect(videosSection).toBeVisible();

    // Section header
    await expect(videosSection.getByRole('heading', { name: 'Videos' })).toBeVisible();
    const viewAllLink = videosSection.getByRole('link', { name: 'View all' });
    await expect(viewAllLink).toBeVisible();
    await expect(viewAllLink).toHaveAttribute('href', LATEST_VIDEOS.viewAllLink);

    // Test Tabs
    const latestTab = videosSection.getByRole('tab', { name: 'Latest' });
    const popularTab = videosSection.getByRole('tab', { name: 'Popular' });

    await expect(latestTab).toBeVisible();
    await expect(popularTab).toBeVisible();

    // Check Latest Videos (Default)
    await latestTab.click();
    const videoGrid = videosSection.locator('.grid');
    const hasVideos = await videoGrid.isVisible();

    if (hasVideos) {
      const firstVideoCard = videoGrid.locator('> div').first();
      await expect(firstVideoCard).toBeVisible();
    } else {
      await expect(videosSection.getByText(LATEST_VIDEOS.emptyTitle)).toBeVisible();
    }

    // Switch to Popular
    await popularTab.click();
    if (hasVideos) {
      const firstVideoCard = videoGrid.locator('> div').first();
      await expect(firstVideoCard).toBeVisible();
    } else {
      await expect(videosSection.getByText(POPULAR_VIDEOS.emptyTitle)).toBeVisible();
    }
  });
});