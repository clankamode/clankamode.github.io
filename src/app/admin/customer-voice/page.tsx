import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

export const dynamic = 'force-dynamic';

type RangeKey = '1d' | '7d' | '14d' | '30d';
type TrackKey = 'all' | string;
type FeedbackCategory = 'bug' | 'idea' | 'content' | 'other';

type FeedbackRow = {
  id: string;
  created_at: string;
  category: FeedbackCategory;
  message: string;
  page_path: string | null;
  contact_email: string | null;
  user_email: string | null;
  metadata: Record<string, unknown> | null;
};

const RANGE_DAYS: Record<RangeKey, number> = {
  '1d': 1,
  '7d': 7,
  '14d': 14,
  '30d': 30,
};

const DEFAULT_TRACKS = ['all', 'dsa', 'job-hunt', 'system-design'] as const;

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function parseRange(raw: string | string[] | undefined): RangeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === '1d' || value === '7d' || value === '14d' || value === '30d') return value;
  return '14d';
}

function parseTrack(raw: string | string[] | undefined): TrackKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value === 'all') return 'all';
  if (!/^[a-z0-9-]+$/.test(value)) return 'all';
  return value;
}

function humanizeToken(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function formatTrackLabel(track: TrackKey): string {
  if (track === 'all') return 'All tracks';
  return humanizeToken(track);
}

function parseFeedbackCategory(value: string | null): FeedbackCategory {
  if (value === 'bug' || value === 'idea' || value === 'content' || value === 'other') return value;
  return 'other';
}

function formatFeedbackCategoryLabel(value: FeedbackCategory): string {
  if (value === 'bug') return 'Bug';
  if (value === 'idea') return 'Idea';
  if (value === 'content') return 'Content issue';
  return 'Other';
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function feedbackAttachmentCount(metadata: Record<string, unknown> | null): number {
  if (!metadata) return 0;
  const attachments = metadata.attachments;
  if (!Array.isArray(attachments)) return 0;
  return attachments.filter((item) => !!item && typeof item === 'object').length;
}

function buildLink(range: RangeKey, track: TrackKey): string {
  const query = new URLSearchParams();
  query.set('range', range);
  query.set('track', track);
  return `/admin/customer-voice?${query.toString()}`;
}

async function fetchFeedbackRows(sinceIso: string, track: TrackKey): Promise<FeedbackRow[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('UserFeedback')
    .select('id, created_at, category, message, page_path, contact_email, user_email, metadata')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error || !data) return [];

  const rows = (data as Array<Omit<FeedbackRow, 'category'> & { category: string | null }>).map((row) => ({
    ...row,
    category: parseFeedbackCategory(row.category),
  }));

  if (track === 'all') return rows;
  const needle = `/${track.toLowerCase()}`;
  return rows.filter((row) => (row.page_path?.toLowerCase() || '').includes(needle));
}

export default async function CustomerVoicePage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string | string[];
    track?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole) || UserRole.USER;
  if (!session || !hasRole(role, UserRole.ADMIN)) redirect('/home');

  const resolved = await searchParams;
  const range = parseRange(resolved?.range);
  const track = parseTrack(resolved?.track);
  const sinceIso = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000).toISOString();

  const feedbackRows = await fetchFeedbackRows(sinceIso, track);
  const feedbackTotalCount = feedbackRows.length;
  const feedbackCategoryCounts = feedbackRows.reduce<Record<FeedbackCategory, number>>((acc, row) => {
    acc[row.category] += 1;
    return acc;
  }, { bug: 0, idea: 0, content: 0, other: 0 });
  const feedbackWithContactCount = feedbackRows.filter((row) => !!(row.contact_email || row.user_email)).length;
  const feedbackWithAttachmentCount = feedbackRows.filter((row) => feedbackAttachmentCount(row.metadata) > 0).length;
  const feedbackPathRows = Array.from(
    feedbackRows.reduce((acc, row) => {
      const path = row.page_path || '(unknown)';
      acc.set(path, (acc.get(path) ?? 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .map(([path, count]) => ({
      path,
      count,
      share: feedbackTotalCount > 0 ? count / feedbackTotalCount : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Admin Observability</p>
          <h1 className="mt-3 text-4xl font-bold text-text-primary">Customer Voice</h1>
          <p className="mt-2 text-text-secondary">Customer feedback inbox and trend analysis for bug reports, ideas, and content issues.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-border-subtle bg-surface-interactive px-3 py-1 text-text-secondary">Window: {range}</span>
            <span className="rounded-full border border-border-subtle bg-surface-interactive px-3 py-1 text-text-secondary">Track: {formatTrackLabel(track)}</span>
            <Link href="/admin/session-intelligence" className="rounded-full border border-border-subtle bg-surface-interactive px-3 py-1 text-cyan-300 hover:text-cyan-200">
              Back to Session Intelligence
            </Link>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['1d', '7d', '14d', '30d'] as RangeKey[]).map((option) => (
            <Link
              key={option}
              href={buildLink(option, track)}
              className={`rounded-full border px-3 py-1 text-xs ${option === range ? 'border-border-interactive text-text-primary bg-surface-interactive' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-interactive'}`}
            >
              {option}
            </Link>
          ))}
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {Array.from(new Set<string>([...DEFAULT_TRACKS])).map((option) => (
            <Link
              key={option}
              href={buildLink(range, option)}
              className={`rounded-full border px-3 py-1 text-xs ${option === track ? 'border-border-interactive text-text-primary bg-surface-interactive' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-interactive'}`}
            >
              {formatTrackLabel(option)}
            </Link>
          ))}
        </div>

        <section className="mb-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <div className="mb-5 grid gap-4 md:grid-cols-5">
            <div className="rounded-lg border border-border-subtle bg-surface p-3">
              <p className="text-xs uppercase tracking-wider text-text-muted">Submissions</p>
              <p className="mt-1 text-xl font-semibold text-text-primary">{feedbackTotalCount}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-3">
              <p className="text-xs uppercase tracking-wider text-text-muted">Bugs</p>
              <p className="mt-1 text-xl font-semibold text-red-300">{feedbackCategoryCounts.bug}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-3">
              <p className="text-xs uppercase tracking-wider text-text-muted">Ideas</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">{feedbackCategoryCounts.idea}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-3">
              <p className="text-xs uppercase tracking-wider text-text-muted">Content Issues</p>
              <p className="mt-1 text-xl font-semibold text-amber-300">{feedbackCategoryCounts.content}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface p-3">
              <p className="text-xs uppercase tracking-wider text-text-muted">Contactable</p>
              <p className="mt-1 text-xl font-semibold text-text-primary">{feedbackWithContactCount}</p>
              <p className="mt-1 text-xs text-text-muted">with email on file</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-2 text-sm font-semibold text-text-primary">Top Pages Mentioned</h2>
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
                    {feedbackPathRows.map((row) => (
                      <tr key={row.path} className="border-t border-border-subtle">
                        <td className="py-2 pr-4 text-text-secondary max-w-[180px] truncate" title={row.path}>{row.path}</td>
                        <td className="py-2 pr-4 text-text-primary">{row.count}</td>
                        <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                      </tr>
                    ))}
                    {feedbackPathRows.length === 0 && (
                      <tr className="border-t border-border-subtle">
                        <td className="py-3 text-text-muted" colSpan={3}>No feedback submitted in this window yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-text-primary">Recent Submissions</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="text-left text-text-muted">
                    <tr>
                      <th className="py-2 pr-3 whitespace-nowrap">Time</th>
                      <th className="py-2 pr-3 whitespace-nowrap">Type</th>
                      <th className="py-2 pr-3 whitespace-nowrap">Page</th>
                      <th className="py-2 pr-3">Message</th>
                      <th className="py-2 pr-3 hidden sm:table-cell whitespace-nowrap">Contact</th>
                      <th className="py-2 hidden sm:table-cell">Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackRows.slice(0, 30).map((row) => (
                      <tr key={row.id} className="border-t border-border-subtle">
                        <td className="py-2 pr-3 text-text-secondary whitespace-nowrap text-xs">{new Date(row.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-3 text-text-primary whitespace-nowrap">{formatFeedbackCategoryLabel(row.category)}</td>
                        <td className="py-2 pr-3 text-text-secondary max-w-[120px] truncate" title={row.page_path || '-'}>{row.page_path || '-'}</td>
                        <td className="py-2 pr-3 text-text-secondary max-w-[200px] break-words">{truncateText(row.message, 100)}</td>
                        <td className="py-2 pr-3 text-text-secondary hidden sm:table-cell max-w-[120px] truncate">{row.contact_email || row.user_email || '-'}</td>
                        <td className="py-2 text-text-primary hidden sm:table-cell">{feedbackAttachmentCount(row.metadata)}</td>
                      </tr>
                    ))}
                    {feedbackRows.length === 0 && (
                      <tr className="border-t border-border-subtle">
                        <td className="py-3 text-text-muted" colSpan={6}>No feedback submissions in this window.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Feedback with attachments: {feedbackWithAttachmentCount}/{feedbackTotalCount}
              </p>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

