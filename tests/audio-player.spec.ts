import { test, expect } from '@playwright/test';
import path from 'path';

// deploy-fix post: 11 content elements, 11 timings
// Timing map (index → {start, end, spoken})
//   0: {0,   0.01}   UNSPOKEN
//   1: {7.2, 69.68}  SPOKEN  ← first spoken
//   2–7: tiny durations     UNSPOKEN
//   8: {66.24, 88.72} SPOKEN
//   9: {83.92, 101.84} SPOKEN
//  10: {101.84, 106.48} SPOKEN

const POST = '/posts/2026-02-21-deploy-fix.html';
const MOCK = path.resolve(__dirname, 'audio-mock.js');

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: MOCK });
  await page.goto(POST);
  await page.waitForSelector('.ap-play');
});

// ── 1. Hydration ──────────────────────────────────────────────────────────────

test('player hydration — controls render', async ({ page }) => {
  await expect(page.locator('.ap-play')).toBeVisible();
  await expect(page.locator('.ap-progress-wrap')).toBeVisible();
  await expect(page.locator('.ap-time')).toBeVisible();
  await expect(page.locator('.ap-speed')).toBeVisible();
  await expect(page.locator('.ap-skip')).toHaveCount(2);
});

// ── 2. Timings ────────────────────────────────────────────────────────────────

test('timings loaded — count matches content elements', async ({ page }) => {
  const { timingsCount, elsCount } = await page.evaluate(() => {
    const timingsEl = document.getElementById('audio-timings')!;
    const timings = JSON.parse(timingsEl.textContent!);
    const area = document.querySelector('.page')!;
    const els: Element[] = [];
    area.querySelectorAll('p, h2, h3, pre').forEach(el => {
      if (
        el.closest('.audio-player') || el.closest('.footer') ||
        el.closest('.post-nav') || el.closest('.meta') ||
        el.classList.contains('post-number')
      ) return;
      if (el.textContent!.trim().length > 5) els.push(el);
    });
    return { timingsCount: timings.length, elsCount: els.length };
  });
  expect(timingsCount).toBe(elsCount);
});

// ── 3. Listen mode ────────────────────────────────────────────────────────────

test('play adds listen-mode class to body', async ({ page }) => {
  await page.click('.ap-play');
  await expect(page.locator('body')).toHaveClass(/listen-mode/);
});

// ── 4. Paragraph sync ─────────────────────────────────────────────────────────

test('paragraph sync — correct element gets lm-active', async ({ page }) => {
  // t=10 → timing[1] (start 7.2, spoken) is the last spoken start ≤ 10
  // element[1] = p "First clue was in the deploy step logs"
  await page.evaluate(() => { (window as any).__mockAudio.currentTime = 10; });
  await page.click('.ap-play');

  // animate() runs synchronously on enterListenMode(); classes are set immediately
  await expect(page.locator('.lm-active')).toHaveCount(1);
  await expect(page.locator('.lm-active')).toContainText('First clue');
});

// ── 5. Unspoken elements skipped ─────────────────────────────────────────────

test('unspoken elements never get lm-active', async ({ page }) => {
  // t=69.71 equals timing[5].start (dur=0.01s, unspoken)
  // Algorithm skips unspoken elements; element[8] (start 66.24) should be active
  // element[8] = p "The interesting part was not the fix..."
  await page.evaluate(() => { (window as any).__mockAudio.currentTime = 69.71; });
  await page.click('.ap-play');

  await expect(page.locator('.lm-active')).toHaveCount(1);
  await expect(page.locator('.lm-active')).toContainText('interesting part');

  // Elements 2–7 (unspoken) must not have lm-active
  const unspokenActive = await page.evaluate(() => {
    const area = document.querySelector('.page')!;
    const allEls = Array.from(area.querySelectorAll('p, h2, h3, pre')).filter(el =>
      !el.closest('.audio-player') && !el.closest('.footer') &&
      !el.closest('.post-nav') && !el.closest('.meta') &&
      !el.classList.contains('post-number') &&
      el.textContent!.trim().length > 5
    );
    // indices 2–7 are the unspoken elements
    return allEls.slice(2, 8).some(el => el.classList.contains('lm-active'));
  });
  expect(unspokenActive).toBe(false);
});

// ── 6. Speed control ──────────────────────────────────────────────────────────

test('speed control cycles 1× → 1.25× → 1.5× → 1.75× → 2× → 1×', async ({ page }) => {
  const btn = page.locator('.ap-speed');
  await expect(btn).toHaveText('1×');

  await btn.click();
  await expect(btn).toHaveText('1.25×');

  await btn.click();
  await expect(btn).toHaveText('1.5×');

  await btn.click();
  await expect(btn).toHaveText('1.75×');

  await btn.click();
  await expect(btn).toHaveText('2×');

  await btn.click();
  await expect(btn).toHaveText('1×');
});

// ── 7. Skip buttons ───────────────────────────────────────────────────────────

test('skip +15s advances currentTime', async ({ page }) => {
  await page.evaluate(() => { (window as any).__mockAudio.currentTime = 50; });
  await page.locator('.ap-skip[data-skip="15"]').click();
  const t = await page.evaluate(() => (window as any).__mockAudio.currentTime);
  expect(t).toBe(65);
});

test('skip -15s rewinds currentTime', async ({ page }) => {
  await page.evaluate(() => { (window as any).__mockAudio.currentTime = 50; });
  await page.locator('.ap-skip[data-skip="-15"]').click();
  const t = await page.evaluate(() => (window as any).__mockAudio.currentTime);
  expect(t).toBe(35);
});
