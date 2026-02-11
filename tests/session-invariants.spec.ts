import { test, expect } from '@playwright/test';

test.describe('Session Invariants (Meaning & Ritual)', () => {
    // Use admin to bypass feature flags if needed, or ensure flag is on
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Gate Invariants: Single Mission and Bounded Scope', async ({ page }) => {
        // 1. Visit Home (Gate)
        await page.goto('/home');

        // Wait for Gate Mode
        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();

        // Invariant 1: One asserted mission (always)
        // We check for the specific mission text element (h3 or similar strong tag)
        // Based on NowCard implementation, it renders SessionIntent.text
        const mission = page.locator('[data-chrome-mode="gate"] h3').filter({ hasText: /Master|Trade|Build/ });
        // We can be more specific if we add a data-testid to the mission text, 
        // but for now let's rely on the structure or just check that *some* text is there.
        // Better: Add data-testid="mission-statement" to NowCard in a future step if this is flaky.
        // For now, let's assume the "Mission Statement" is the prominent text.
        await expect(mission).toBeVisible();

        // Invariant 2: Scope is bounded (Item count + minutes)
        await expect(page.locator('text=/min/')).toBeVisible(); // e.g. "20 min"
        await expect(page.locator('text=/item/')).toBeVisible(); // e.g. "1 item"

        // Invariant 3: Alternatives hidden (no infinite scroll / "Change track" requires action)
        // "Change track" button should exist
        await expect(page.getByRole('button', { name: /change/i })).toBeVisible();
        // But the track list (alternatives) should NOT be visible initially
        // (Assuming drawer logic hides it)
    });

    test('Execute Invariants: Zero Global Nav', async ({ page }) => {
        await page.goto('/home');
        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');

        // Wait for Phase Change: idle -> execution
        await expect(page.locator('[data-session-phase="execution"]')).toBeVisible();

        // Invariant 1: Zero global nav
        await expect(page.locator('nav').first()).not.toBeVisible(); // Navbar
        await expect(page.locator('footer').first()).not.toBeVisible(); // Footer

        // Invariant 2: SessionHUD present
        // We can check for the progress dots or the HUD container
        await expect(page.locator('.fixed.bottom-6')).toBeVisible(); // Heuristic for HUD
    });

    test('Exit Invariants: Inevitable Exit & Truthful Next', async ({ page }) => {
        // Setup: deep link to a known session item or fast-forward
        // Since we don't have a dev-route to force exit, we play through a short session.
        // Actually, we can just click "Complete" if we are in a session.

        await page.goto('/home');
        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-session-phase="execution"]')).toBeVisible();

        // Complete the item
        // Look for "Complete & continue" button
        const completeBtn = page.getByRole('button', { name: /Complete/i });
        await completeBtn.click();

        // Wait for Exit Phase
        await expect(page.locator('[data-session-phase="exit"]')).toBeVisible();
        await expect(page.locator('[data-chrome-mode="exit"]')).toBeVisible();

        // Invariant 1: Primary action is Internalize & Close (might be disabled initially)
        await expect(page.getByRole('button', { name: /Internalize & Close/i })).toBeVisible();

        // Invariant 2: Truthful Next
        // We know our default stub / dsa track MIGHT generate a specific proposal.
        // If it does, it shows "Next: ...". If not, it shows nothing.
        // We can assert that IF "Next" is shown, it must be the specific micro-session format.
        const nextBtn = page.getByRole('button', { name: /Next:/i });

        if (await nextBtn.isVisible()) {
            const text = await nextBtn.textContent();
            expect(text).toMatch(/Next: .+ \(\d+ min\)/); // "Next: Pointer invariants (3 min)"
        } else {
            // If not visible, ensure the attribute reflects false
            await expect(page.locator('[data-has-micro-proposal="false"]')).toBeVisible();
        }
    });

    test('Exit Invariants: Micro-Session Navigation', async ({ page }) => {
        // This test requires a specific setup where we KNOW a micro-session is proposed.
        // For now, we verify the golden path if it exists.
        // In a real env, we'd mock the provider or seed the DB.
        // Let's skip specifically asserting the navigation target unless we control the seed.
        // But we CAN assert that clicking "Internalize" goes back to Gate.

        await page.goto('/home');
        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();
        await page.waitForTimeout(500); // Wait for hydration/listeners
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-session-phase="execution"]')).toBeVisible();

        await page.getByRole('button', { name: /Complete/i }).click();
        await expect(page.locator('[data-session-phase="exit"]')).toBeVisible();

        // Handle Earned Fingerprint Ritual if present
        const ritualHeader = page.getByText('What changed?');
        if (await ritualHeader.isVisible()) {
            await page.locator('button').filter({ hasText: /I learned:|I clarified:/ }).first().click();
        }

        const internalizeBtn = page.getByRole('button', { name: /Internalize & Close/i });
        await expect(internalizeBtn).toBeEnabled();
        await internalizeBtn.click();

        // Assert return to Gate
        await expect(page.locator('[data-chrome-mode="gate"]')).toBeVisible();
        await expect(page.locator('[data-session-phase="idle"]')).toBeVisible();
    });

});
