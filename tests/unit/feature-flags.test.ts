import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { UserRole } from '@/types/roles';

/**
 * Feature flag access control tests.
 *
 * Core invariants:
 * - Role-restricted flags (allowRoles set) NEVER expose features to users outside those roles,
 *   regardless of defaultValue or env vars.
 * - Regular users and unauthenticated callers must never see gated features.
 * - Kill switch (defaultValue: false) blocks everyone, including ADMIN.
 * - Flags without allowRoles behave purely on defaultValue (fully launched features).
 */

// We need to control env vars before the module is loaded — use vi.stubEnv
// and re-import the module in each relevant test group.

describe('isFeatureEnabled — role-restricted flags', () => {
    beforeEach(() => {
        vi.resetModules();
        // Simulate env vars enabled (worst case — everything "on")
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PROGRESS', 'true');
        vi.stubEnv('NEXT_PUBLIC_ENABLE_SESSION_MODE', 'true');
        vi.stubEnv('NEXT_PUBLIC_USE_MICRO_V1', 'true');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('blocks regular USER from PROGRESS_TRACKING even when env var is true', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: UserRole.USER })).toBe(false);
    });

    it('blocks regular USER from SESSION_MODE even when env var is true', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.SESSION_MODE, { role: UserRole.USER })).toBe(false);
    });

    it('blocks regular USER from GENERATIVE_SESSIONS even when defaultValue is true', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, { role: UserRole.USER })).toBe(false);
    });

    it('blocks unauthenticated (null user) from PROGRESS_TRACKING', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, null)).toBe(false);
    });

    it('blocks unauthenticated (undefined user) from SESSION_MODE', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.SESSION_MODE, undefined)).toBe(false);
    });

    it('blocks user with no role from GENERATIVE_SESSIONS', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, {})).toBe(false);
    });

    it('grants ADMIN access to PROGRESS_TRACKING when env var is true', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: UserRole.ADMIN })).toBe(true);
    });

    it('grants ADMIN access to SESSION_MODE when env var is true', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.SESSION_MODE, { role: UserRole.ADMIN })).toBe(true);
    });

    it('grants ADMIN access to GENERATIVE_SESSIONS', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, { role: UserRole.ADMIN })).toBe(true);
    });

    it('grants INSIDER access to GENERATIVE_SESSIONS', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, { role: UserRole.INSIDER })).toBe(true);
    });

    it('blocks EDITOR from GENERATIVE_SESSIONS (EDITOR is not in allowRoles)', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, { role: UserRole.EDITOR })).toBe(false);
    });
});

describe('isFeatureEnabled — kill switch (defaultValue: false)', () => {
    beforeEach(() => {
        vi.resetModules();
        // All env vars OFF
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PROGRESS', 'false');
        vi.stubEnv('NEXT_PUBLIC_ENABLE_SESSION_MODE', 'false');
        vi.stubEnv('NEXT_PUBLIC_USE_MICRO_V1', 'false');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('blocks ADMIN from PROGRESS_TRACKING when env var is false (kill switch)', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: UserRole.ADMIN })).toBe(false);
    });

    it('blocks ADMIN from SESSION_MODE when env var is false (kill switch)', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.SESSION_MODE, { role: UserRole.ADMIN })).toBe(false);
    });

    it('blocks ADMIN from PERSONALIZATION_SCOPE_EXPERIMENT (defaultValue always false)', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.PERSONALIZATION_SCOPE_EXPERIMENT, { role: UserRole.ADMIN })).toBe(false);
    });

    it('blocks INSIDER from FRICTION_INTELLIGENCE (defaultValue always false)', async () => {
        const { isFeatureEnabled, FeatureFlags } = await import('@/lib/flags');
        expect(isFeatureEnabled(FeatureFlags.FRICTION_INTELLIGENCE, { role: UserRole.INSIDER })).toBe(false);
    });
});

describe('isFeatureEnabled — all role-restricted flags deny regular users', () => {
    beforeEach(() => {
        vi.resetModules();
        // Everything ON — env vars maximally permissive
        vi.stubEnv('NEXT_PUBLIC_ENABLE_PROGRESS', 'true');
        vi.stubEnv('NEXT_PUBLIC_ENABLE_SESSION_MODE', 'true');
        vi.stubEnv('NEXT_PUBLIC_USE_MICRO_V1', 'true');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it.each([
        'progress_tracking',
        'session_mode',
        'use_micro_v1',
        'generative_sessions',
        'personalization_scope_experiment',
        'friction_intelligence',
        'ai_triage_automation',
        'ai_policy_session_plan',
        'ai_policy_scope',
        'ai_policy_onboarding',
        'ai_policy_triage',
    ] as const)('flag %s is never exposed to USER role', async (flagValue) => {
        const { isFeatureEnabled } = await import('@/lib/flags');
        expect(isFeatureEnabled(flagValue, { role: UserRole.USER })).toBe(false);
    });

    it.each([
        'progress_tracking',
        'session_mode',
        'use_micro_v1',
        'generative_sessions',
        'personalization_scope_experiment',
        'friction_intelligence',
        'ai_triage_automation',
        'ai_policy_session_plan',
        'ai_policy_scope',
        'ai_policy_onboarding',
        'ai_policy_triage',
    ] as const)('flag %s is never exposed to unauthenticated callers', async (flagValue) => {
        const { isFeatureEnabled } = await import('@/lib/flags');
        expect(isFeatureEnabled(flagValue, null)).toBe(false);
        expect(isFeatureEnabled(flagValue, undefined)).toBe(false);
        expect(isFeatureEnabled(flagValue, {})).toBe(false);
    });
});
