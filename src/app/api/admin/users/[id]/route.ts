import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

const VALID_ROLES = new Set<string>(Object.values(UserRole));

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

  if (!token || !hasRole(effectiveRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = req.nextUrl.pathname.split('/').pop() ?? '';
  const userId = parseInt(id, 10);
  if (Number.isNaN(userId) || userId < 1) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const role = body?.role;
  if (typeof role !== 'string' || !VALID_ROLES.has(role)) {
    return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('Users')
    .update({ role })
    .eq('id', userId)
    .select('id, email, username, role, created_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('admin users update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  return NextResponse.json(data);
}
