import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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

  const admin = getSupabaseAdminClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from('ResumeReviews')
    .select('id, created_at, author_name, title, context, resume_url, resume_filename, status, review_notes, reviewed_at, vote_count', { count: 'exact' })
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: true })
    .range(from, to);

  if (statusFilter === 'pending') {
    query = query.eq('status', 'pending');
  } else if (statusFilter === 'reviewed') {
    query = query.eq('status', 'reviewed');
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('admin resume review list error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [], total: count ?? 0, page, limit });
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

  if (!token || !hasRole(effectiveRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, review_notes } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  if (status && !['pending', 'reviewed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (typeof review_notes === 'string') {
    updates.review_notes = review_notes.trim() || null;
    if (review_notes.trim()) {
      updates.status = 'reviewed';
      updates.reviewed_at = new Date().toISOString();
    }
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('ResumeReviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('admin resume review patch error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}
