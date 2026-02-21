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
    .from('AmaQuestions')
    .select('id, created_at, author_name, question, status, answer, answered_at, vote_count', { count: 'exact' })
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: true })
    .range(from, to);

  if (statusFilter === 'unanswered') {
    query = query.eq('status', 'unanswered');
  } else if (statusFilter === 'answered') {
    query = query.eq('status', 'answered');
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('admin ama list error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  return NextResponse.json({ questions: data ?? [], total: count ?? 0, page, limit });
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

  if (!token || !hasRole(effectiveRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, answer } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  if (status && !['unanswered', 'answered'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (typeof answer === 'string') {
    updates.answer = answer.trim() || null;
    if (answer.trim()) {
      updates.status = 'answered';
      updates.answered_at = new Date().toISOString();
    }
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('AmaQuestions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('admin ama patch error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }

  return NextResponse.json({ question: data });
}
