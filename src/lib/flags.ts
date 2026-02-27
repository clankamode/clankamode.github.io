import { UserRole } from '@/types/roles';

export const FeatureFlags = {
    PROGRESS_TRACKING: 'progress_tracking',
    SESSION_MODE: 'session_mode',
    USE_MICRO_V1: 'use_micro_v1',
    GENERATIVE_SESSIONS: 'generative_sessions',
    AI_TUTOR: 'ai_tutor',
    PERSONALIZATION_SCOPE_EXPERIMENT: 'personalization_scope_experiment',
    FRICTION_INTELLIGENCE: 'friction_intelligence',
    AI_TRIAGE_AUTOMATION: 'ai_triage_automation',
    AI_POLICY_SESSION_PLAN: 'ai_policy_session_plan',
    AI_POLICY_SCOPE: 'ai_policy_scope',
    AI_POLICY_ONBOARDING: 'ai_policy_onboarding',
    AI_POLICY_TRIAGE: 'ai_policy_triage',
} as const;

export type FeatureFlag = (typeof FeatureFlags)[keyof typeof FeatureFlags];

interface FlagConfig {
    defaultValue: boolean;
    allowRoles?: UserRole[];
}

export const flags: Record<FeatureFlag, FlagConfig> = {
    [FeatureFlags.PROGRESS_TRACKING]: {
        defaultValue: process.env.NEXT_PUBLIC_ENABLE_PROGRESS === 'true',
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.SESSION_MODE]: {
        defaultValue: process.env.NEXT_PUBLIC_ENABLE_SESSION_MODE === 'true',
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.USE_MICRO_V1]: {
        defaultValue: process.env.NEXT_PUBLIC_USE_MICRO_V1 === 'true',
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.GENERATIVE_SESSIONS]: {
        defaultValue: true,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.AI_TUTOR]: {
        defaultValue: true,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.PERSONALIZATION_SCOPE_EXPERIMENT]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.FRICTION_INTELLIGENCE]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.AI_TRIAGE_AUTOMATION]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.AI_POLICY_SESSION_PLAN]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.AI_POLICY_SCOPE]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.AI_POLICY_ONBOARDING]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.AI_POLICY_TRIAGE]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
};

export function isFeatureEnabled(flag: FeatureFlag, user?: { role?: string } | null): boolean {
    const config = flags[flag];

    // If the flag has role restrictions, role always wins.
    // defaultValue acts as a kill switch only (false = nobody; true = allowed roles only).
    if (config.allowRoles && config.allowRoles.length > 0) {
        if (!config.defaultValue) return false;
        if (!user?.role) return false;
        return config.allowRoles.includes(user.role as UserRole);
    }

    // No role restrictions — fully launched feature, defaultValue controls for everyone.
    return config.defaultValue;
}
