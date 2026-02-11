import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole, hasRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';

export async function middleware(req: NextRequest) {
    try {
        const token = await getToken({
            req,
        });

        const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);
        const progressEnabled = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: effectiveRole });
        const sessionModeEnabled = isFeatureEnabled(FeatureFlags.SESSION_MODE, { role: effectiveRole });
        const sessionFeaturesEnabled = progressEnabled && sessionModeEnabled;

        if (req.nextUrl.pathname === '/') {
            if (token) {
                return NextResponse.redirect(new URL(sessionFeaturesEnabled ? '/home' : '/learn', req.url));
            }
            return NextResponse.next();
        }

        if (req.nextUrl.pathname === '/home') {
            if (!token) {
                return NextResponse.redirect(new URL('/', req.url));
            }
            if (!sessionFeaturesEnabled) {
                return NextResponse.redirect(new URL('/learn', req.url));
            }
            return NextResponse.next();
        }

        if (req.nextUrl.pathname === '/explore') {
            if (!token) {
                return NextResponse.redirect(new URL('/', req.url));
            }
            if (!sessionFeaturesEnabled) {
                return NextResponse.redirect(new URL('/learn', req.url));
            }
            return NextResponse.next();
        }

        if (req.nextUrl.pathname.startsWith('/learn') && !req.nextUrl.pathname.startsWith('/learn/progress')) {
            return NextResponse.next();
        }

        if (!token) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        const userRole = effectiveRole;

        if (req.nextUrl.pathname.startsWith('/admin')) {
            if (!hasRole(userRole, UserRole.EDITOR)) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

        if (req.nextUrl.pathname.startsWith('/thumbnails') || req.nextUrl.pathname.startsWith('/api/thumbnail_job')) {
            if (!hasRole(userRole, UserRole.EDITOR)) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        } else if (req.nextUrl.pathname.startsWith('/analytics')) {
            if (!hasRole(userRole, UserRole.ADMIN)) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

        if (req.nextUrl.pathname.startsWith('/ai') || req.nextUrl.pathname.startsWith('/api/chat')) {
            if (!hasRole(userRole, UserRole.EDITOR)) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

        if (req.nextUrl.pathname.startsWith('/practice-test') || req.nextUrl.pathname.startsWith('/api/test-session')) {
            if (!hasRole(userRole, UserRole.USER)) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

        if (
            req.nextUrl.pathname.startsWith('/learn/progress') ||
            req.nextUrl.pathname.startsWith('/api/progress') ||
            req.nextUrl.pathname.startsWith('/api/bookmarks')
        ) {
            if (!progressEnabled) {
                return NextResponse.redirect(new URL('/learn', req.url));
            }
        }
    } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/home',
        '/explore',
        '/admin/:path*',
        '/analytics',
        '/thumbnails/:path*',
        '/api/thumbnail_job/:path*',
        '/practice-test',
        '/api/test-session/:path*',
        '/learn/:path*',
        '/api/progress/:path*',
        '/api/bookmarks',
        '/ai',
        '/api/chat/:path*',
    ],
}
