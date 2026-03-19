import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const CONTENT_SELECTOR = 'p, h2, h3, pre, .highlight';
const narratedPosts = fs.readdirSync(POSTS_DIR)
  .filter((file) => file.endsWith('.html'))
  .filter((file) => {
    const html = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    return html.includes('id="audio-timings"');
  })
  .sort();

test.describe('embedded audio timings', () => {
  for (const file of narratedPosts) {
    test(`${file} stays aligned with syncable content`, async ({ page }) => {
      await page.goto(`/posts/${file}`);

      const result = await page.evaluate((selector) => {
        const timings = JSON.parse(document.getElementById('audio-timings')!.textContent!);
        const area = document.querySelector('article') || document.querySelector('.page');
        const elements: string[] = [];
        area!.querySelectorAll(selector).forEach((el) => {
          if (
            el.closest('.audio-player') ||
            el.closest('.footer') ||
            el.closest('.post-nav') ||
            el.closest('.meta') ||
            el.classList.contains('post-number')
          ) {
            return;
          }

          if (el.textContent!.trim().length > 5) {
            elements.push(el.textContent!.trim().replace(/\s+/g, ' ').slice(0, 80));
          }
        });

        const issues: string[] = [];
        if (timings.length !== elements.length) {
          issues.push(`timings=${timings.length} content=${elements.length}`);
        }

        let previousStart = -Infinity;
        timings.forEach((timing: { start: number; end: number }, index: number) => {
          if (typeof timing?.start !== 'number' || typeof timing?.end !== 'number') {
            issues.push(`timing ${index} is missing numeric start/end`);
            return;
          }
          if (timing.end < timing.start) {
            issues.push(`timing ${index} has negative duration (${timing.start} -> ${timing.end})`);
          }
          if (timing.start < previousStart) {
            issues.push(`timing ${index} starts before ${previousStart}`);
          }
          previousStart = timing.start;
        });

        return { issues, elements, timings };
      }, CONTENT_SELECTOR);

      expect(result.issues, `Timing audit failed for ${file}`).toEqual([]);
    });
  }
});
