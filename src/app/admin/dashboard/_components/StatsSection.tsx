import type { DashboardStats } from '@/lib/admin-dashboard-stats';
import { CumulativeUsersChart } from './CumulativeUsersChart';
import { DailyLineChart } from './DailyLineChart';

interface StatsSectionProps {
  stats: DashboardStats;
}

function fillLast30Days(series: { date: string; count: number }[]): { date: string; count: number }[] {
  const byDate = new Map(series.map((s) => [s.date, s.count]));
  const result: { date: string; count: number }[] = [];
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: byDate.get(key) ?? 0 });
  }
  return result;
}

export function StatsSection({ stats }: StatsSectionProps) {
  const signups = fillLast30Days(stats.dailySignupsLast30);
  const dau = fillLast30Days(stats.dailyActiveUsersLast30);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-text-muted">Statistics</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-6">
          <p className="text-sm text-text-muted">Cumulative users</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
            {stats.cumulativeUsers.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-6">
          <p className="text-sm text-text-muted">Daily signups (last 30 days)</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
            {signups.reduce((a, s) => a + s.count, 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-text-muted">Total in period</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-workbench/60 p-6">
          <p className="text-sm text-text-muted">Daily active users (last 30 days)</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
            {dau.reduce((a, s) => a + s.count, 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-text-muted">Total sign-ins in period</p>
        </div>
      </div>

      <div className="mt-8">
        <CumulativeUsersChart />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <DailyLineChart data={signups} title="Signups by day" />
        <DailyLineChart data={dau} title="Daily active users by day" />
      </div>
    </section>
  );
}
