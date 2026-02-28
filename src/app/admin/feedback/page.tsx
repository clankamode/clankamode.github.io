import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';
import { FeedbackTable } from './_components/FeedbackTable';

export const dynamic = 'force-dynamic';

type RangeKey = '1d' | '7d' | '14d' | '30d';
type FeedbackCategory = 'bug' | 'idea' | 'content' | 'other';

type FeedbackRow = {
  id: string;
  created_at: string;
  category: FeedbackCategory;
  page_path: string | null;
  contact_email: string | null;
  user_email: string | null;
};

const RANGE_DAYS: Record<RangeKey, number> = {
  '1d': 1,
  '7d': 7,
  '14d': 14,
  '30d': 30,
};

function parseRange(raw: string | string[] | undefined): RangeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === '1d' || value === '7d' || value === '14d' || value === '30d') return value;
  return '14d';
}

function parseFeedbackCategory(value: string | null): FeedbackCategory {
  if (value === 'bug' || value === 'idea' || value === 'content' || value === 'other') return value;
  return 'other';
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function buildRangeLink(range: RangeKey): string {
  const query = new URLSearchParams();
  query.set('range', range);
  return `/admin/feedback?${query.toString()}`;
}

async function fetchFeedbackRows(sinceIso: string): Promise<FeedbackRow[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('UserFeedback')
    .select('id, created_at, category, page_path, contact_email, user_email')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error || !data) return [];

  return (data as Array<Omit<FeedbackRow, 'category'> & { category: string | null }>).map((row) => ({
    ...row,
    category: parseFeedbackCategory(row.category),
  }));
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole) || UserRole.USER;

  if (!session || !hasRole(role, UserRole.EDITOR)) {
    redirect('/');
  }

  if (!hasRole(role, UserRole.ADMIN)) {
    redirect('/admin/content');
  }

  const resolved = await searchParams;
  const range = parseRange(resolved?.range);
  const sinceIso = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000).toISOString();

  const feedbackRows = await fetchFeedbackRows(sinceIso);
  const totalSubmissions = feedbackRows.length;
  const categoryCounts = feedbackRows.reduce<Record<FeedbackCategory, number>>((acc, row) => {
    acc[row.category] += 1;
    return acc;
  }, { bug: 0, idea: 0, content: 0, other: 0 });
  const contactableCount = feedbackRows.filter((row) => !!(row.contact_email || row.user_email)).length;
  const topPages = Array.from(
    feedbackRows.reduce((acc, row) => {
      const path = row.page_path || '(unknown)';
      acc.set(path, (acc.get(path) ?? 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .map(([path, count]) => ({
      path,
      count,
      share: totalSubmissions > 0 ? count / totalSubmissions : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.32em] text-text-muted">Admin</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary">Feedback</h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Track submission trends and manage user feedback in one place.
          </p>
        </div>

        <details open className="mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-surface-workbench/60">
          <summary className="flex cursor-pointer list-none items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Analytics</p>
              <p className="mt-1 text-sm text-text-secondary">Submission summary for the selected window</p>
            </div>
            <span className="rounded-full border border-border-subtle bg-surface-dense px-3 py-1 text-xs text-text-secondary">
              Window: {range}
            </span>
          </summary>
          <div className="p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {(['1d', '7d', '14d', '30d'] as RangeKey[]).map((option) => (
                <Link
                  key={option}
                  href={buildRangeLink(option)}
                  className={`rounded-full border px-3 py-1 text-xs ${option === range ? 'border-border-interactive bg-surface-interactive text-text-primary' : 'border-border-subtle text-text-secondary hover:bg-surface-interactive hover:text-text-primary'}`}
                >
                  {option}
                </Link>
              ))}
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-lg border border-border-subtle bg-surface p-3 lg:col-span-2">
                <p className="text-xs uppercase tracking-wider text-text-muted">Total submissions</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">{totalSubmissions}</p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface p-3">
                <p className="text-xs uppercase tracking-wider text-text-muted">Bugs</p>
                <p className="mt-1 text-xl font-semibold text-red-300">{categoryCounts.bug}</p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface p-3">
                <p className="text-xs uppercase tracking-wider text-text-muted">Ideas</p>
                <p className="mt-1 text-xl font-semibold text-emerald-300">{categoryCounts.idea}</p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface p-3">
                <p className="text-xs uppercase tracking-wider text-text-muted">Content</p>
                <p className="mt-1 text-xl font-semibold text-amber-300">{categoryCounts.content}</p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface p-3">
                <p className="text-xs uppercase tracking-wider text-text-muted">Other</p>
                <p className="mt-1 text-xl font-semibold text-text-primary">{categoryCounts.other}</p>
              </div>
              <div className="rounded-lg border border-border-subtle bg-surface p-3 lg:col-span-2">
                <p className="text-xs uppercase tracking-wider text-text-muted">Contactable</p>
                <p className="mt-1 text-xl font-semibold text-text-primary">{contactableCount}</p>
                <p className="mt-1 text-xs text-text-muted">with email on file</p>
              </div>
            </div>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-text-primary">Top Pages</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted">
                    <tr>
                      <th className="py-2 pr-4">Page</th>
                      <th className="py-2 pr-4 whitespace-nowrap">Submissions</th>
                      <th className="py-2 whitespace-nowrap">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((row) => (
                      <tr key={row.path} className="border-t border-border-subtle">
                        <td className="max-w-[280px] truncate py-2 pr-4 text-text-secondary" title={row.path}>{row.path}</td>
                        <td className="py-2 pr-4 text-text-primary">{row.count}</td>
                        <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                      </tr>
                    ))}
                    {topPages.length === 0 && (
                      <tr className="border-t border-border-subtle">
                        <td className="py-3 text-text-muted" colSpan={3}>No feedback in this window.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </details>

        <FeedbackTable />
      </div>
    </div>
  );
}
