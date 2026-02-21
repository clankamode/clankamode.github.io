import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

export interface DailyCount {
  date: string;
  count: number;
}

export interface DashboardStats {
  cumulativeUsers: number;
  dailySignupsLast30: DailyCount[];
  dailyActiveUsersLast30: DailyCount[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const admin = getSupabaseAdminClient();

  const [
    { count: cumulativeUsers },
    { data: signupsRows, error: signupsError },
    { data: dauRows, error: dauError },
  ] = await Promise.all([
    admin.from('Users').select('*', { count: 'exact', head: true }),
    admin.rpc('get_signups_by_day_last_30'),
    admin.rpc('get_dau_by_day_last_30'),
  ]);

  if (signupsError) {
    console.error('get_signups_by_day_last_30 error:', signupsError);
  }
  if (dauError) {
    console.error('get_dau_by_day_last_30 error:', dauError);
  }

  const dailySignupsLast30 = (signupsRows ?? []).map((r: { day: string; count: number }) => ({
    date: r.day,
    count: Number(r.count),
  }));
  const dailyActiveUsersLast30 = (dauRows ?? []).map((r: { day: string; count: number }) => ({
    date: r.day,
    count: Number(r.count),
  }));

  return {
    cumulativeUsers: cumulativeUsers ?? 0,
    dailySignupsLast30,
    dailyActiveUsersLast30,
  };
}
