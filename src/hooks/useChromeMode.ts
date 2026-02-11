'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { UserRole, hasRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';

export type ChromeMode =
    | 'marketing'
    | 'app'
    | 'gate'
    | 'execute'
    | 'exit'
    | 'studio';

const STUDIO_ROUTES = ['/thumbnails', '/gallery', '/clips', '/ai', '/admin'];

export function useChromeMode(): ChromeMode {
    const { data: session, status } = useSession();
    const { state: sessionState } = useSessionContext();
    const pathname = usePathname();
    const isAuthLoading = status === 'loading';

    // Prevent refresh flicker into logged-out chrome while auth is resolving.
    if (isAuthLoading) {
        if (sessionState.phase === 'execution') {
            return 'execute';
        }
        if (sessionState.phase === 'exit') {
            return 'exit';
        }
        if (pathname === '/home') {
            return 'gate';
        }
        return 'app';
    }

    const isSessionModeEnabled = isFeatureEnabled(FeatureFlags.SESSION_MODE, session?.user);

    if (sessionState.phase === 'execution' && isSessionModeEnabled) {
        return 'execute';
    }

    if (sessionState.phase === 'exit' && isSessionModeEnabled) {
        return 'exit';
    }

    if (!session) {
        return 'marketing';
    }

    const effectiveRole = session.user?.role as UserRole | undefined;
    const isEditor = effectiveRole && hasRole(effectiveRole, UserRole.EDITOR);

    if (isEditor && STUDIO_ROUTES.some(route => pathname.startsWith(route))) {
        return 'studio';
    }

    if (pathname === '/home' && isSessionModeEnabled) {
        return 'gate';
    }

    return 'app';
}

export function useChromeVisibility() {
    const mode = useChromeMode();

    return {
        mode,
        showNavbar: mode !== 'execute',
        showFooter: mode === 'marketing',
        showSessionHUD: mode === 'execute',
    };
}
