import { test, expect } from '@playwright/test';

// Test data constants
const PAGE_TITLE = 'Coding Interviews - YouTube Channel';
const HERO_FALLBACK_NAME = 'James Peralta';
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
    const heroSection = page.getByRole('region').filter({ hasText: HERO_FALLBACK_NAME });
    await expect(heroSection).toBeVisible();

    // Hero section elements
    await expect(heroSection.getByText('NEW VIDEOS DAILY')).toBeVisible();
    await expect(heroSection.getByRole('heading', { level: 1 })).toContainText(HERO_FALLBACK_NAME);
    await expect(heroSection.getByText(HERO_FALLBACK_DESCRIPTION)).toBeVisible();

    // Hero section buttons
    const youtubeButton = heroSection.getByRole('link', { name: /Watch on YouTube/i });
    await expect(youtubeButton).toBeVisible();
    await expect(youtubeButton).toHaveAttribute('target', '_blank');
    await expect(youtubeButton).toHaveAttribute('rel', 'noopener noreferrer');

    const browseButton = heroSection.getByRole('link', { name: 'Browse Videos' });
    await expect(browseButton).toBeVisible();
    await expect(browseButton).toHaveAttribute('href', '/videos');

    // 3. Latest Videos Section
    const latestVideosSection = page.getByRole('region').filter({ hasText: LATEST_VIDEOS.title });
    await expect(latestVideosSection).toBeVisible();
    
    // Section header
    await expect(latestVideosSection.getByRole('heading', { name: LATEST_VIDEOS.title })).toBeVisible();
    const viewAllLink = latestVideosSection.getByRole('link', { name: 'View all' });
    await expect(viewAllLink).toBeVisible();
    await expect(viewAllLink).toHaveAttribute('href', LATEST_VIDEOS.viewAllLink);

    // Check for videos or empty state
    const latestVideosGrid = latestVideosSection.locator('.grid-cols-1');
    const hasLatestVideos = await latestVideosGrid.isVisible();
    
    if (hasLatestVideos) {
      // Verify video grid and first video card
      const firstVideoCard = latestVideosGrid.locator('> div').first();
      await expect(firstVideoCard).toBeVisible();
      await expect(firstVideoCard.locator('img')).toBeVisible(); // Thumbnail
      await expect(firstVideoCard.locator('h3')).toBeVisible(); // Title
    } else {
      // Verify empty state
      const emptyState = latestVideosSection.locator(`div:has-text("${LATEST_VIDEOS.emptyTitle}")`);
      await expect(emptyState).toBeVisible();
      await expect(latestVideosSection.getByText(LATEST_VIDEOS.emptyMessage)).toBeVisible();
    }

    // 4. Popular Videos Section
    const popularVideosSection = page.getByRole('region').filter({ hasText: POPULAR_VIDEOS.title });
    await expect(popularVideosSection).toBeVisible();
    
    // Section header
    await expect(popularVideosSection.getByRole('heading', { name: POPULAR_VIDEOS.title })).toBeVisible();

    // Check for videos or empty state
    const popularVideosGrid = popularVideosSection.locator('.grid-cols-1');
    const hasPopularVideos = await popularVideosGrid.isVisible();
    
    if (hasPopularVideos) {
      // Verify video grid and first video card
      const firstVideoCard = popularVideosGrid.locator('> div').first();
      await expect(firstVideoCard).toBeVisible();
      await expect(firstVideoCard.locator('img')).toBeVisible(); // Thumbnail
      await expect(firstVideoCard.locator('h3')).toBeVisible(); // Title
    } else {
      // Verify empty state
      const emptyState = popularVideosSection.locator(`div:has-text("${POPULAR_VIDEOS.emptyTitle}")`);
      await expect(emptyState).toBeVisible();
      await expect(popularVideosSection.getByText(POPULAR_VIDEOS.emptyMessage)).toBeVisible();
    }
  });
}); 