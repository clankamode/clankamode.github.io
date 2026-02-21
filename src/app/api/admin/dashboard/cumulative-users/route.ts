import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

const RANGES = new Set(['30d', '90d', '180d', '365d', 'all']);

function getDateRange(range: string): { start: Date; end: Date } | null {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);

  switch (range) {
    case '30d':
      start.setDate(start.getDate() - 29);
      break;
    case '90d':
      start.setDate(start.getDate() - 89);
      break;
    case '180d':
      start.setDate(start.getDate() - 179);
      break;
    case '365d':
      start.setDate(start.getDate() - 364);
      break;
    case 'all':
      return null;
    default:
      return null;
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);

  if (!token || !hasRole(effectiveRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const range = req.nextUrl.searchParams.get('range') ?? '30d';
  if (!RANGES.has(range)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  let startDate: string;
  let endDate: string;

  if (range === 'all') {
    const { data: minRow, error: minError } = await admin
      .from('Users')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (minError || !minRow?.created_at) {
      const today = new Date().toISOString().slice(0, 10);
      return NextResponse.json({ series: [{ date: today, count: 0 }] });
    }
    startDate = new Date(minRow.created_at).toISOString().slice(0, 10);
    endDate = new Date().toISOString().slice(0, 10);
  } else {
    const pair = getDateRange(range);
    if (!pair) {
      return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
    }
    startDate = pair.start.toISOString().slice(0, 10);
    endDate = pair.end.toISOString().slice(0, 10);
  }

  const { data: rows, error } = await admin.rpc('get_cumulative_users_by_day', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error('get_cumulative_users_by_day error:', error);
    return NextResponse.json({ error: 'Failed to fetch cumulative users' }, { status: 500 });
  }

  const series = (rows ?? []).map((r: { day: string; count: number }) => ({
    date: r.day,
    count: Number(r.count),
  }));

  return NextResponse.json({ series });
}
