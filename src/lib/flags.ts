import { UserRole } from '@/types/roles';

export const FeatureFlags = {
    PROGRESS_TRACKING: 'progress_tracking',
    SESSION_MODE: 'session_mode',
    USE_MICRO_V1: 'use_micro_v1',
    GENERATIVE_SESSIONS: 'generative_sessions',
    PERSONALIZATION_SCOPE_EXPERIMENT: 'personalization_scope_experiment',
    FRICTION_INTELLIGENCE: 'friction_intelligence',
    AI_TRIAGE_AUTOMATION: 'ai_triage_automation',
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
    [FeatureFlags.PERSONALIZATION_SCOPE_EXPERIMENT]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN, UserRole.INSIDER],
    },
    [FeatureFlags.FRICTION_INTELLIGENCE]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN],
    },
    [FeatureFlags.AI_TRIAGE_AUTOMATION]: {
        defaultValue: false,
        allowRoles: [UserRole.ADMIN],
    },
};

export function isFeatureEnabled(flag: FeatureFlag, user?: { role?: string } | null): boolean {
    const config = flags[flag];
    if (config.defaultValue) return true;

    if (user?.role && config.allowRoles) {
        const userRole = user.role as UserRole;
        if (config.allowRoles.includes(userRole)) {
            return true;
        }
    }

    return false;
}
