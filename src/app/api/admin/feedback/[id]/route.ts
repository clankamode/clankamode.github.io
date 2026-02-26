import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

const VALID_STATUS = new Set(['open', 'closed']);
const VALID_RESOLUTIONS = new Set(['resolved', 'wont_fix', 'duplicate', 'not_a_bug']);

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

  if (!token || !hasRole(effectiveRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = req.nextUrl.pathname.split('/').pop() ?? '';
  if (!id) {
    return NextResponse.json({ error: 'Invalid feedback id' }, { status: 400 });
  }

  let body: { status?: string; resolution?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const status = body?.status;
  if (typeof status !== 'string' || !VALID_STATUS.has(status)) {
    return NextResponse.json({ error: 'status must be "open" or "closed"' }, { status: 400 });
  }

  const resolution = body?.resolution ?? null;
  if (status === 'closed' && resolution !== null && !VALID_RESOLUTIONS.has(resolution)) {
    return NextResponse.json(
      { error: 'resolution must be one of: resolved, wont_fix, duplicate, not_a_bug' },
      { status: 400 },
    );
  }

  const dbStatus = status === 'open' ? 'new' : 'closed';

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('UserFeedback')
    .update({
      status: dbStatus,
      resolution: status === 'open' ? null : resolution,
    })
    .eq('id', id)
    .select('id, created_at, category, message, page_path, contact_email, user_email, status, resolution')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }
    console.error('admin feedback update error:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    isOpen: data.status === 'new' || data.status === 'reviewing',
  });
}
