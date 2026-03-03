import { test, expect } from '@playwright/test';
import path from 'path';

const POST = '/posts/2026-02-21-deploy-fix.html';
const MOCK = path.resolve(__dirname, 'audio-mock.js');
const CONTENT_SELECTOR = 'p, h2, h3, pre, .highlight';

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

test('timings loaded — post has usable timing/content mapping', async ({ page }) => {
  const { timingsCount, elsCount, usableCount } = await page.evaluate((selector) => {
    const timingsEl = document.getElementById('audio-timings')!;
    const timings = JSON.parse(timingsEl.textContent!);
    const area = document.querySelector('.page')!;
    const els: Element[] = [];
    area.querySelectorAll(selector).forEach(el => {
      if (
        el.closest('.audio-player') || el.closest('.footer') ||
        el.closest('.post-nav') || el.closest('.meta') ||
        el.classList.contains('post-number')
      ) return;
      if (el.textContent!.trim().length > 5) els.push(el);
    });
    return {
      timingsCount: timings.length,
      elsCount: els.length,
      usableCount: Math.min(timings.length, els.length),
    };
  }, CONTENT_SELECTOR);
  expect(timingsCount).toBeGreaterThan(0);
  expect(elsCount).toBeGreaterThan(0);
  expect(usableCount).toBeGreaterThan(0);
});

// ── 3. Listen mode ────────────────────────────────────────────────────────────

test('play adds listen-mode class to body', async ({ page }) => {
  await page.click('.ap-play');
  await expect(page.locator('body')).toHaveClass(/listen-mode/);
});

// ── 4. Paragraph sync ─────────────────────────────────────────────────────────

test('paragraph sync — correct element gets lm-active', async ({ page }) => {
  const { targetTime, expectedIdx } = await page.evaluate((selector) => {
    const timings = JSON.parse(document.getElementById('audio-timings')!.textContent!);
    const area = document.querySelector('.page')!;
    const els = Array.from(area.querySelectorAll(selector)).filter(el =>
      !el.closest('.audio-player') &&
      !el.closest('.footer') &&
      !el.closest('.post-nav') &&
      !el.closest('.meta') &&
      !el.classList.contains('post-number') &&
      el.textContent!.trim().length > 5
    );

    const maxIdx = Math.min(timings.length, els.length);
    let firstSpokenIdx = -1;
    for (let i = 0; i < maxIdx; i++) {
      const dur = timings[i].end - timings[i].start;
      if (dur > 0.5) {
        firstSpokenIdx = i;
        break;
      }
    }

    const idx = firstSpokenIdx > -1 ? firstSpokenIdx : 0;
    const start = timings[idx]?.start ?? 0;
    return { targetTime: start + 0.05, expectedIdx: idx };
  }, CONTENT_SELECTOR);

  await page.evaluate((t) => { (window as any).__mockAudio.currentTime = t; }, targetTime);
  await page.click('.ap-play');

  await expect(page.locator('.lm-active')).toHaveCount(1);
  const activeIdx = await page.evaluate((selector) => {
    const area = document.querySelector('.page')!;
    const allEls = Array.from(area.querySelectorAll(selector)).filter(el =>
      !el.closest('.audio-player') &&
      !el.closest('.footer') &&
      !el.closest('.post-nav') &&
      !el.closest('.meta') &&
      !el.classList.contains('post-number') &&
      el.textContent!.trim().length > 5
    );
    return allEls.findIndex(el => el.classList.contains('lm-active'));
  }, CONTENT_SELECTOR);
  expect(activeIdx).toBe(expectedIdx);
});

// ── 5. Unspoken elements skipped ─────────────────────────────────────────────

test('unspoken elements never get lm-active', async ({ page }) => {
  const scenario = await page.evaluate((selector) => {
    const timings = JSON.parse(document.getElementById('audio-timings')!.textContent!);
    const area = document.querySelector('.page')!;
    const allEls = Array.from(area.querySelectorAll(selector)).filter(el =>
      !el.closest('.audio-player') &&
      !el.closest('.footer') &&
      !el.closest('.post-nav') &&
      !el.closest('.meta') &&
      !el.classList.contains('post-number') &&
      el.textContent!.trim().length > 5
    );

    const maxIdx = Math.min(timings.length, allEls.length);
    for (let i = 1; i < maxIdx; i++) {
      const dur = timings[i].end - timings[i].start;
      if (dur > 0.5) continue;

      for (let j = i - 1; j >= 0; j--) {
        const prevDur = timings[j].end - timings[j].start;
        if (prevDur > 0.5) {
          return {
            targetTime: timings[i].start + 0.001,
            expectedIdx: j,
            unspokenIdx: i,
          };
        }
      }
    }

    return null;
  }, CONTENT_SELECTOR);

  expect(scenario).not.toBeNull();
  await page.evaluate((t) => { (window as any).__mockAudio.currentTime = t; }, scenario!.targetTime);
  await page.click('.ap-play');

  await expect(page.locator('.lm-active')).toHaveCount(1);
  const { activeIdx, unspokenActive } = await page.evaluate(({ selector, unspokenIdx }) => {
    const area = document.querySelector('.page')!;
    const allEls = Array.from(area.querySelectorAll(selector)).filter(el =>
      !el.closest('.audio-player') && !el.closest('.footer') &&
      !el.closest('.post-nav') && !el.closest('.meta') &&
      !el.classList.contains('post-number') &&
      el.textContent!.trim().length > 5
    );
    return {
      activeIdx: allEls.findIndex(el => el.classList.contains('lm-active')),
      unspokenActive: allEls[unspokenIdx]?.classList.contains('lm-active') ?? false,
    };
  }, { selector: CONTENT_SELECTOR, unspokenIdx: scenario!.unspokenIdx });
  expect(activeIdx).toBe(scenario!.expectedIdx);
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
