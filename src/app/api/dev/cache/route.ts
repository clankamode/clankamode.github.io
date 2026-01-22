import { clearDevCache, getCacheStats } from '@/lib/dev-cache';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole, hasRole } from '@/types/roles';

async function requireEditor(req: NextRequest) {
  const token = await getToken({ req });
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

  if (!token || !hasRole(effectiveRole, UserRole.EDITOR)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return null;
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const authResponse = await requireEditor(req);
  if (authResponse) {
    return authResponse;
  }
  
  return NextResponse.json(getCacheStats());
}

export async function DELETE(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const authResponse = await requireEditor(req);
  if (authResponse) {
    return authResponse;
  }
  
  clearDevCache();
  return NextResponse.json({ message: 'Cache cleared' });
}
