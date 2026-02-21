import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const VALID_ROLES = new Set<string>(Object.values(UserRole));

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

  if (!token || !hasRole(effectiveRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get('limit')) || DEFAULT_LIMIT));
  const role = searchParams.get('role') ?? undefined;
  const searchRaw = searchParams.get('search')?.trim();

  if (role && !VALID_ROLES.has(role)) {
    return NextResponse.json({ error: 'Invalid role filter' }, { status: 400 });
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const admin = getSupabaseAdminClient();
  let query = admin
    .from('Users')
    .select('id, email, username, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (role) {
    query = query.eq('role', role);
  }

  if (searchRaw && searchRaw.length > 0) {
    const escaped = searchRaw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pattern = `*${escaped}*`;
    query = query.or(`email.ilike.${pattern},username.ilike.${pattern}`);
  }

  const { data: users, error, count } = await query;

  if (error) {
    console.error('admin users list error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  return NextResponse.json({
    users: users ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
