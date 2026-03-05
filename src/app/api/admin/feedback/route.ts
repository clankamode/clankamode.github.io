import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { isMissingFeedbackResolutionColumn } from '@/lib/supabase-compat';
import { UserRole, hasRole } from '@/types/roles';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STATUS_FILTER = new Set(['open', 'closed', 'all']);
const CATEGORY_FILTER = new Set(['all', 'bug', 'idea', 'content', 'other']);
const FEEDBACK_SELECT_BASE =
  'id, created_at, category, message, page_path, contact_email, user_email, status, metadata';
const FEEDBACK_SELECT_WITH_RESOLUTION = `${FEEDBACK_SELECT_BASE}, resolution`;

type StatusFilterValue = 'open' | 'closed' | 'all';
type CategoryFilterValue = 'all' | 'bug' | 'idea' | 'content' | 'other';
type FeedbackQueryRow = {
  status: string;
  resolution?: string | null;
  [k: string]: unknown;
};
type FeedbackQueryError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null;

function isOpen(status: string): boolean {
  return status === 'new' || status === 'reviewing';
}

function buildFeedbackQuery(params: {
  admin: ReturnType<typeof getSupabaseAdminClient>;
  from: number;
  to: number;
  statusFilter: StatusFilterValue;
  categoryFilter: CategoryFilterValue;
  includeResolution: boolean;
}) {
  const { admin, from, to, statusFilter, categoryFilter, includeResolution } = params;

  let query = admin
    .from('UserFeedback')
    .select(includeResolution ? FEEDBACK_SELECT_WITH_RESOLUTION : FEEDBACK_SELECT_BASE, {
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

  return query;
}

async function runFeedbackQuery(params: {
  admin: ReturnType<typeof getSupabaseAdminClient>;
  from: number;
  to: number;
  statusFilter: StatusFilterValue;
  categoryFilter: CategoryFilterValue;
  includeResolution: boolean;
}): Promise<{ rows: FeedbackQueryRow[] | null; error: FeedbackQueryError; count: number | null }> {
  const result = await buildFeedbackQuery(params);
  return {
    rows: result.data as unknown as FeedbackQueryRow[] | null,
    error: result.error,
    count: result.count,
  };
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

  const typedStatusFilter = statusFilter as StatusFilterValue;
  const typedCategoryFilter = categoryFilter as CategoryFilterValue;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const admin = getSupabaseAdminClient();
  let { rows, error, count } = await runFeedbackQuery({
    admin,
    from,
    to,
    statusFilter: typedStatusFilter,
    categoryFilter: typedCategoryFilter,
    includeResolution: true,
  });

  if (error && isMissingFeedbackResolutionColumn(error)) {
    console.warn('[admin/feedback] UserFeedback.resolution column missing — falling back to query without resolution. Run migration 20260305000000_restore_feedback_resolution_column to fix.');
    const fallbackResult = await runFeedbackQuery({
      admin,
      from,
      to,
      statusFilter: typedStatusFilter,
      categoryFilter: typedCategoryFilter,
      includeResolution: false,
    });
    rows = fallbackResult.rows;
    error = fallbackResult.error;
    count = fallbackResult.count;
  }

  if (error) {
    console.error('admin feedback list error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }

  const feedback = (rows ?? []).map((r: FeedbackQueryRow) => ({
    ...r,
    resolution: r.resolution ?? null,
    isOpen: isOpen(r.status),
  }));

  return NextResponse.json({
    feedback,
    total: count ?? 0,
    page,
    limit,
  });
}
