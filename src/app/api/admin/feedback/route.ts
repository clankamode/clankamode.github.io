import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STATUS_FILTER = new Set(['open', 'closed', 'all']);
const CATEGORY_FILTER = new Set(['all', 'bug', 'idea', 'content', 'other']);

function isOpen(status: string): boolean {
  return status === 'new' || status === 'reviewing';
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

  if (!token || !hasRole(effectiveRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get('limit')) || DEFAULT_LIMIT));
  const statusFilter = searchParams.get('status') ?? 'all';
  const categoryFilter = searchParams.get('category') ?? 'all';

  if (!STATUS_FILTER.has(statusFilter)) {
    return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
  }
  if (!CATEGORY_FILTER.has(categoryFilter)) {
    return NextResponse.json({ error: 'Invalid category filter' }, { status: 400 });
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const admin = getSupabaseAdminClient();
  let query = admin
    .from('UserFeedback')
    .select('id, created_at, category, message, page_path, contact_email, user_email, status, metadata', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (statusFilter === 'open') {
    query = query.in('status', ['new', 'reviewing']);
  } else if (statusFilter === 'closed') {
    query = query.eq('status', 'closed');
  }

  if (categoryFilter !== 'all') {
    query = query.eq('category', categoryFilter);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    console.error('admin feedback list error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }

  const feedback = (rows ?? []).map((r: { status: string; [k: string]: unknown }) => ({
    ...r,
    isOpen: isOpen(r.status),
  }));

  return NextResponse.json({
    feedback,
    total: count ?? 0,
    page,
    limit,
  });
}
