import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';
import { UserRole } from '@/types/roles';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || 'test@example.com';
  const roleParam = searchParams.get('role') || 'USER';
  const name = searchParams.get('name') || 'Test User';

  const role = Object.values(UserRole).includes(roleParam as UserRole)
    ? (roleParam as UserRole)
    : UserRole.USER;

  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      { error: 'NEXTAUTH_SECRET is not configured' },
      { status: 500 }
    );
  }

  const token = await encode({
    token: {
      email,
      role,
      id: email,
      name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  });

  const isHttps = process.env.NEXTAUTH_URL?.startsWith('https://');
  const cookieName = isHttps
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  return NextResponse.json({
    success: true,
    email,
    role,
    name,
  });
}
