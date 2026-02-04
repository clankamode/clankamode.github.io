import { UserRole, hasRole } from '@/types/roles';

export const FeatureFlags = {
    PROGRESS_TRACKING: 'progress_tracking',
} as const;

export type FeatureFlag = (typeof FeatureFlags)[keyof typeof FeatureFlags];

interface FlagConfig {
    defaultValue: boolean;
    allowRoles?: UserRole[];
}

export const flags: Record<FeatureFlag, FlagConfig> = {
    [FeatureFlags.PROGRESS_TRACKING]: {
        // Default OFF for public, unless env var says true
        defaultValue: process.env.NEXT_PUBLIC_ENABLE_PROGRESS === 'true',
        // Admins always get access for testing
        allowRoles: [UserRole.ADMIN],
    },
};

export function isFeatureEnabled(flag: FeatureFlag, user?: { role?: string } | null): boolean {
    const config = flags[flag];
    if (config.defaultValue) return true;

    if (user?.role && config.allowRoles) {
        const userRole = user.role as UserRole;
        if (config.allowRoles.some((role) => hasRole(userRole, role))) {
            return true;
        }
    }

    return false;
}
