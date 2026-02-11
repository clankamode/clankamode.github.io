import { test, expect } from '@playwright/test';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

const supabaseAdmin = getSupabaseAdminClient();

const USER_PROJECTS = new Set(['chromium-admin']);
const isUserProject = (projectName: string) => USER_PROJECTS.has(projectName);

test.describe('Session Telemetry', () => {
    test('gate_shown event fires on home page load', async ({ page }, testInfo) => {
        test.skip(!isUserProject(testInfo.project.name), 'Admin-only test');

        // 1. Visit Home (trigger gate_shown)
        await page.goto('/home?track=dsa');

        // 2. Wait for server action to complete (network idle isn't enough for server actions sometimes)
        await page.waitForTimeout(2000);

        // 3. Verify in DB
        const { data: events } = await supabaseAdmin
            .from('TelemetryEvents')
            .select('*')
            .eq('event_type', 'gate_shown')
            .eq('mode', 'gate')
            .eq('email', 'e2e-admin@example.com') // Derived from session, now using 'email' column
            .order('created_at', { ascending: false })
            .limit(1);

        expect(events).toBeDefined();
        expect(events?.length).toBeGreaterThan(0);
        const event = events![0];
        expect(event.track_slug).toBe('dsa');
    });

    test('session_committed event fires on session start', async ({ page }, testInfo) => {
        test.skip(!isUserProject(testInfo.project.name), 'Admin-only test');

        await page.goto('/home?track=dsa');

        // Click Start Session
        await page.click('[data-session-cta]');

        // Wait for navigation
        await page.waitForURL(/\/learn\/.*/);

        // Wait for server action
        await page.waitForTimeout(2000);

        const { data: events } = await supabaseAdmin
            .from('TelemetryEvents')
            .select('*')
            .eq('event_type', 'session_committed')
            .eq('mode', 'gate')
            .eq('email', 'e2e-admin@example.com') // Derived from session, now using 'email' column
            .order('created_at', { ascending: false })
            .limit(1);

        expect(events).toBeDefined();
        expect(events?.length).toBeGreaterThan(0);
        const event = events![0];
        expect(event.track_slug).toBe('dsa');
    });
});
