import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole, hasRole } from '@/types/roles';

export async function middleware(req: NextRequest) {
    try {
        const token = await getToken({ 
            req,
        });
        
        if (!token) {
            return NextResponse.redirect(new URL('/', req.url));
        }
        
        const userRole = token.role as UserRole;
        
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

        // Check if the route is tools-related
        if (req.nextUrl.pathname.startsWith('/tools')) {
            if (!hasRole(userRole, UserRole.EDITOR)) {
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
    matcher: ['/analytics', '/thumbnails/:path*', '/api/thumbnail_job/:path*'],
}
