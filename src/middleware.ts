import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole, hasRole } from '@/types/roles';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';

function buildWelcomeRedirect(req: NextRequest): NextResponse {
    const welcomeUrl = new URL('/welcome', req.url);
    const path = req.nextUrl.pathname;
    const fullPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;

    const isSafeReturnTo =
        path !== '/' &&
        path !== '/welcome' &&
        !path.startsWith('/api/') &&
        fullPath.startsWith('/');

    if (isSafeReturnTo) {
        welcomeUrl.searchParams.set('returnTo', fullPath);
    }

    return NextResponse.redirect(welcomeUrl);
}

export async function middleware(req: NextRequest) {
    try {
        const token = await getToken({
            req,
        });

        const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);
        const firstLoginPending = !!token?.firstLoginPending;
        const progressEnabled = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, { role: effectiveRole });
        const sessionModeEnabled = isFeatureEnabled(FeatureFlags.SESSION_MODE, { role: effectiveRole });
        const sessionFeaturesEnabled = progressEnabled && sessionModeEnabled;
        const postLoginDefaultPath = sessionFeaturesEnabled ? '/home' : '/learn';
        const welcomeFlowEnabled = sessionFeaturesEnabled && firstLoginPending;

        if (req.nextUrl.pathname === '/') {
            if (token) {
                if (welcomeFlowEnabled) {
                    return buildWelcomeRedirect(req);
                }
                return NextResponse.redirect(new URL(postLoginDefaultPath, req.url));
            }
            return NextResponse.next();
        }

        if (req.nextUrl.pathname === '/welcome') {
            if (!token) {
                return NextResponse.redirect(new URL('/', req.url));
            }
            const isAdminWelcomePreview =
                process.env.NODE_ENV !== 'production' &&
                hasRole(effectiveRole, UserRole.ADMIN) &&
                req.nextUrl.searchParams.get('preview') === '1';
            if (!welcomeFlowEnabled && !isAdminWelcomePreview) {
                return NextResponse.redirect(new URL(postLoginDefaultPath, req.url));
            }
            return NextResponse.next();
        }

        if (token && welcomeFlowEnabled && !req.nextUrl.pathname.startsWith('/api/')) {
            return buildWelcomeRedirect(req);
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

        if (req.nextUrl.pathname.startsWith('/session')) {
            if (!token) {
                return NextResponse.redirect(new URL('/', req.url));
            }
            if (!sessionFeaturesEnabled) {
                return NextResponse.redirect(new URL('/learn', req.url));
            }
            return NextResponse.next();
        }

        if (req.nextUrl.pathname === '/learn/progress') {
            if (!progressEnabled) {
                return NextResponse.redirect(new URL('/learn', req.url));
            }
            return NextResponse.next();
        }

        if (req.nextUrl.pathname.startsWith('/learn')) {
            return NextResponse.next();
        }

        if (req.nextUrl.pathname.startsWith('/profile')) {
            return NextResponse.next();
        }

        if (req.nextUrl.pathname.startsWith('/api/profile') && req.method === 'GET') {
            return NextResponse.next();
        }

        if (req.nextUrl.pathname.startsWith('/code-editor/mock') || req.nextUrl.pathname.startsWith('/api/interview-questions')) {
            if (!token) {
                return NextResponse.redirect(new URL('/assessment', req.url));
            }
            return NextResponse.next();
        }

        if (req.nextUrl.pathname.startsWith('/code-editor/practice') || req.nextUrl.pathname.startsWith('/api/peralta75')) {
            if (!token) {
                const signInUrl = new URL('/api/auth/signin', req.url);
                signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
                return NextResponse.redirect(signInUrl);
            }
            return NextResponse.next();
        }

        if (req.nextUrl.pathname.startsWith('/live') || req.nextUrl.pathname.startsWith('/api/ama') || req.nextUrl.pathname.startsWith('/api/resume-review')) {
            if (!token) {
                const signInUrl = new URL('/api/auth/signin', req.url);
                signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
                return NextResponse.redirect(signInUrl);
            }
            return NextResponse.next();
        }

        if (!token) {
            const signInUrl = new URL('/api/auth/signin', req.url);
            signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
            return NextResponse.redirect(signInUrl);
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
        '/welcome',
        '/explore',
        '/session/:path*',
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
        '/code-editor/mock',
        '/code-editor/practice/:path*',
        '/api/interview-questions/:path*',
        '/api/peralta75/:path*',
        '/profile/:path*',
        '/api/profile',
        '/api/profile/:path*',
        '/api/questions/solved',
        '/live',
        '/live/:path*',
        '/api/ama/:path*',
        '/api/resume-review/:path*',
    ],
}
