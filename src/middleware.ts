import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
    try {
        const token = await getToken({ 
            req,
        });
        
        if (!token) {
            return NextResponse.redirect(new URL('/', req.url));
        }
         
    } catch (error) {
        console.log('error', error);
        return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/analytics'],
}
