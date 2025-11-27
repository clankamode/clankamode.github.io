import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole, hasRole } from '@/types/roles';

export async function middleware(req: NextRequest) {
    try {
        const token = await getToken({ 
            req,
        });
        
        const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

        // Special handling for home page
        if (req.nextUrl.pathname === '/') {
            // If user is logged in and is an editor, redirect to /ai
            if (token && effectiveRole === UserRole.EDITOR) {
                console.log('Redirecting editor to /ai from home page');
                return NextResponse.redirect(new URL('/ai', req.url));
            }
            console.log('Home page access - Role:', effectiveRole);
            // Otherwise, allow access to home page
            return NextResponse.next();
        }
        
        // For all other protected routes, require authentication
        if (!token) {
            return NextResponse.redirect(new URL('/', req.url));
        }
        
        const userRole = effectiveRole;
        
        // Check if the route is thumbnail-related
        if (req.nextUrl.pathname.startsWith('/thumbnails') || req.nextUrl.pathname.startsWith('/api/thumbnail_job')) {
            if (!hasRole(userRole, UserRole.EDITOR)) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        } else if (req.nextUrl.pathname.startsWith('/analytics')) {
            if (!hasRole(userRole, UserRole.ADMIN)) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

        // Check if the route is AI-related
        if (req.nextUrl.pathname.startsWith('/ai') || req.nextUrl.pathname.startsWith('/api/chat')) {
            if (!hasRole(userRole, UserRole.EDITOR)) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

        // Check if the route is practice-test-related
        if (req.nextUrl.pathname.startsWith('/practice-test') || req.nextUrl.pathname.startsWith('/api/test-session')) {
            if (!hasRole(userRole, UserRole.USER)) {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }
    } catch (error) {
        console.log('error', error);
        return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/analytics', '/thumbnails/:path*', '/api/thumbnail_job/:path*', '/practice-test', '/api/test-session/:path*', '/ai', '/api/chat'],
}
