import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('BlockEditor Coverage', () => {
    test.setTimeout(60000);

    test('should open insert menu at correct position and handle scrolling', async ({ page }) => {
        await page.goto('/admin/test-workbench');

        const editor = page.getByPlaceholder('Start writing... (type / for blocks)');
        await expect(editor).toBeVisible();

        const firstBlock = page.locator('[data-block-id]').first();
        await firstBlock.hover();
        const insertBtn = firstBlock.getByRole('button', { name: '+ Insert' });
        await expect(insertBtn).toBeVisible();
        await insertBtn.click();

        const menu = page.locator('div.fixed.z-20').filter({ hasText: 'Insert block' });
        await expect(menu).toBeVisible();

        await expect(menu).toHaveAttribute('style', /top: \d+(\.\d+)?px/);
        await expect(menu).toHaveAttribute('style', /right: \d+(\.\d+)?px/);

        await menu.getByRole('button', { name: 'Code' }).click();
        await expect(page.locator('[data-block-id]')).toHaveCount(2);

        const newBlock = page.locator('[data-block-id]').nth(1);
        await expect(newBlock).toBeInViewport();
    });

    test('should handle slash command menu positioning', async ({ page }) => {
        await page.goto('/admin/test-workbench');

        const editor = page.getByPlaceholder('Start writing... (type / for blocks)').first();
        await editor.click();
        await editor.fill('/');

        const menu = page.locator('div.fixed.z-20').filter({ hasText: 'Insert block' });
        await expect(menu).toBeVisible();

        await expect(menu).toHaveCSS('top', '80px');
        await expect(menu).toHaveCSS('right', '0px');
    });

    test('should flip menu position when it would overflow the bottom', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 400 });
        await page.goto('/admin/test-workbench');

        const editor = page.getByPlaceholder('Start writing... (type / for blocks)').first();
        for (let i = 0; i < 10; i++) {
            await editor.press('Enter');
        }

        const lastBlock = page.locator('[data-block-id]').last();
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await lastBlock.hover();

        const insertBtn = lastBlock.getByRole('button', { name: '+ Insert' });
        await insertBtn.click();

        const menu = page.locator('div.fixed.z-20').filter({ hasText: 'Insert block' });
        await expect(menu).toBeVisible();

        const btnBox = await insertBtn.boundingBox();
        const menuBox = await menu.boundingBox();

        expect(btnBox).toBeTruthy();
        expect(menuBox).toBeTruthy();
        expect(menuBox!.y).toBeLessThan(btnBox!.y);
    });
});
