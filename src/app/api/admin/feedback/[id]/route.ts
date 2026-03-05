import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { isMissingFeedbackResolutionColumn } from '@/lib/supabase-compat';
import { UserRole, hasRole } from '@/types/roles';

const VALID_STATUS = new Set(['open', 'closed']);
const VALID_RESOLUTIONS = new Set(['resolved', 'wont_fix', 'duplicate', 'not_a_bug']);
const FEEDBACK_UPDATE_SELECT_BASE = 'id, created_at, category, message, page_path, contact_email, user_email, status';
const FEEDBACK_UPDATE_SELECT_WITH_RESOLUTION = `${FEEDBACK_UPDATE_SELECT_BASE}, resolution`;

type FeedbackUpdateRow = {
  status: string;
  resolution?: string | null;
  [k: string]: unknown;
};
type FeedbackUpdateError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null;

async function updateFeedback(params: {
  admin: ReturnType<typeof getSupabaseAdminClient>;
  id: string;
  status: string;
  resolution: string | null;
  includeResolution: boolean;
}): Promise<{ data: FeedbackUpdateRow | null; error: FeedbackUpdateError }> {
  const { admin, id, status, resolution, includeResolution } = params;
  const updatePayload: { status: string; resolution?: string | null } = { status };
  if (includeResolution) {
    updatePayload.resolution = resolution;
  }

  const result = await admin
    .from('UserFeedback')
    .update(updatePayload)
    .eq('id', id)
    .select(includeResolution ? FEEDBACK_UPDATE_SELECT_WITH_RESOLUTION : FEEDBACK_UPDATE_SELECT_BASE)
    .single();
  return {
    data: result.data as unknown as FeedbackUpdateRow | null,
    error: result.error,
  };
}

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
  const dbResolution = status === 'open' ? null : resolution;

  const admin = getSupabaseAdminClient();
  let { data, error } = await updateFeedback({
    admin,
    id,
    status: dbStatus,
    resolution: dbResolution,
    includeResolution: true,
  });

  if (error && isMissingFeedbackResolutionColumn(error)) {
    console.warn('[admin/feedback] UserFeedback.resolution column missing — falling back to update without resolution. Run migration 20260305000000_restore_feedback_resolution_column to fix.');
    const fallbackResult = await updateFeedback({
      admin,
      id,
      status: dbStatus,
      resolution: dbResolution,
      includeResolution: false,
    });
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }
    console.error('admin feedback update error:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    resolution: data.resolution ?? null,
    isOpen: data.status === 'new' || data.status === 'reviewing',
  });
}
