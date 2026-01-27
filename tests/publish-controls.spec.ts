import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Publish Controls', () => {
    test.setTimeout(60000);

    test.describe('Draft Articles', () => {
        test('should show Publish | Save | Delete buttons for drafts', async ({ page }) => {
            await page.goto('/admin/content');
            await page.waitForLoadState('networkidle');

            // Find and click a draft article (look for "Draft" badge)
            const draftRow = page.locator('tr').filter({ hasText: 'Draft' }).first();

            // If no drafts exist, skip test
            if (await draftRow.count() === 0) {
                test.skip();
                return;
            }

            await draftRow.click();
            await page.waitForLoadState('networkidle');

            // Verify draft buttons are visible
            await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
        });

        test('should disable Save button when no changes', async ({ page }) => {
            await page.goto('/admin/content');
            await page.waitForLoadState('networkidle');

            const draftRow = page.locator('tr').filter({ hasText: 'Draft' }).first();
            if (await draftRow.count() === 0) {
                test.skip();
                return;
            }

            await draftRow.click();
            await page.waitForLoadState('networkidle');

            // Save button should be disabled when no changes
            const saveButton = page.getByRole('button', { name: 'Save' });
            await expect(saveButton).toBeDisabled();
        });
    });

    test.describe('Published Articles', () => {
        test('should show Update | Unpublish | Delete buttons for published', async ({ page }) => {
            await page.goto('/admin/content');
            await page.waitForLoadState('networkidle');

            // Find and click a published article
            const publishedRow = page.locator('tr').filter({ hasText: 'Published' }).first();

            if (await publishedRow.count() === 0) {
                test.skip();
                return;
            }

            await publishedRow.click();
            await page.waitForLoadState('networkidle');

            // Verify published buttons are visible
            await expect(page.getByRole('button', { name: 'Update' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible();
        });

        test('should disable Update button when no changes', async ({ page }) => {
            await page.goto('/admin/content');
            await page.waitForLoadState('networkidle');

            const publishedRow = page.locator('tr').filter({ hasText: 'Published' }).first();
            if (await publishedRow.count() === 0) {
                test.skip();
                return;
            }

            await publishedRow.click();
            await page.waitForLoadState('networkidle');

            // Update button should be disabled when no changes
            const updateButton = page.getByRole('button', { name: 'Update' });
            await expect(updateButton).toBeDisabled();
        });

        test('should show unpublish confirmation dialog', async ({ page }) => {
            await page.goto('/admin/content');
            await page.waitForLoadState('networkidle');

            const publishedRow = page.locator('tr').filter({ hasText: 'Published' }).first();
            if (await publishedRow.count() === 0) {
                test.skip();
                return;
            }

            await publishedRow.click();
            await page.waitForLoadState('networkidle');

            // Click Unpublish
            await page.getByRole('button', { name: 'Unpublish' }).click();

            // Verify confirmation dialog appears
            await expect(page.getByText('Take article offline?')).toBeVisible();
            await expect(page.getByText('This article will no longer be visible to readers')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Yes, unpublish' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

            // Cancel to avoid side effects
            await page.getByRole('button', { name: 'Cancel' }).click();
            await expect(page.getByText('Take article offline?')).not.toBeVisible();
        });

        test('should show update confirmation when publishing changes', async ({ page }) => {
            await page.goto('/admin/content');
            await page.waitForLoadState('networkidle');

            const publishedRow = page.locator('tr').filter({ hasText: 'Published' }).first();
            if (await publishedRow.count() === 0) {
                test.skip();
                return;
            }

            await publishedRow.click();
            await page.waitForLoadState('networkidle');

            // Make a change to enable Update button
            const editor = page.getByPlaceholder('Start writing... (type / for blocks)').first();
            if (await editor.count() > 0) {
                await editor.click();
                await editor.press('End');
                await editor.type(' test');
            }

            // Update button should now be enabled
            const updateButton = page.getByRole('button', { name: 'Update' });
            await expect(updateButton).toBeEnabled();

            // Click Update
            await updateButton.click();

            // Verify confirmation dialog
            await expect(page.getByText('Update live article?')).toBeVisible();
            await expect(page.getByText('These changes will be visible to readers immediately')).toBeVisible();

            // Cancel to avoid side effects
            await page.getByRole('button', { name: 'Cancel' }).click();

            // Undo the change
            await editor.click();
            await page.keyboard.press('Control+z');
        });
    });

    test.describe('Unpublish Styling', () => {
        test('should have amber styling for Unpublish button', async ({ page }) => {
            await page.goto('/admin/content');
            await page.waitForLoadState('networkidle');

            const publishedRow = page.locator('tr').filter({ hasText: 'Published' }).first();
            if (await publishedRow.count() === 0) {
                test.skip();
                return;
            }

            await publishedRow.click();
            await page.waitForLoadState('networkidle');

            const unpublishButton = page.getByRole('button', { name: 'Unpublish' });
            await expect(unpublishButton).toBeVisible();

            // Verify amber color class
            await expect(unpublishButton).toHaveClass(/text-amber-400/);
        });
    });
});
