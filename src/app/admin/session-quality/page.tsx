import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';
import {
  buildFunnelByFirstItem,
  buildRepeatAnalysis,
  normalizeTelemetryHref,
  type CommittedEventInput,
  type CompletedEventInput,
  type FinalizedEventInput,
} from '@/lib/session-recommendation-quality';

export const dynamic = 'force-dynamic';

type TelemetryRow = {
  email: string;
  google_id: string | null;
  session_id: string;
  created_at: string;
  payload: Record<string, unknown> | null;
};

type ArticleMeta = {
  slug: string;
  title: string;
  primary_concept: string | null;
  concept_tags: unknown;
};

function hrefToArticleSlug(href: string): string | null {
  const clean = normalizeTelemetryHref(href);
  const segments = clean.split('/').filter(Boolean);
  if (segments.length < 3 || segments[0] !== 'learn') return null;
  return segments[2] || null;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function buildUserKey(email: string, googleId: string | null): string {
  return googleId ? `${email} (${googleId.slice(0, 8)}...)` : email;
}

async function fetchTelemetryRows(eventType: string, sinceIso: string): Promise<TelemetryRow[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('TelemetryEvents')
    .select('email, google_id, session_id, created_at, payload')
    .eq('event_type', eventType)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })
    .limit(5000);

  if (error || !data) return [];
  return data as TelemetryRow[];
}

export default async function SessionQualityPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user?.role as UserRole | undefined) ?? UserRole.USER;

  if (!session?.user?.email) {
    redirect('/');
  }

  if (!hasRole(userRole, UserRole.ADMIN)) {
    redirect('/home');
  }

  const now = new Date();
  const since14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [committedRows, completedRows, finalizedRows] = await Promise.all([
    fetchTelemetryRows('session_committed', since14d),
    fetchTelemetryRows('item_completed', since14d),
    fetchTelemetryRows('session_finalized', since14d),
  ]);

  const committedEvents: CommittedEventInput[] = committedRows
    .map((row) => {
      const href = row.payload && typeof row.payload.itemHref === 'string'
        ? normalizeTelemetryHref(row.payload.itemHref)
        : null;
      if (!href) return null;
      return {
        userKey: buildUserKey(row.email, row.google_id),
        createdAt: row.created_at,
        href,
        sessionId: row.session_id,
      } satisfies CommittedEventInput;
    })
    .filter((row): row is CommittedEventInput => !!row);

  const completedEvents: CompletedEventInput[] = completedRows
    .map((row) => {
      const href = row.payload && typeof row.payload.itemHref === 'string'
        ? normalizeTelemetryHref(row.payload.itemHref)
        : null;
      if (!href) return null;
      return {
        sessionId: row.session_id,
        createdAt: row.created_at,
        href,
      } satisfies CompletedEventInput;
    })
    .filter((row): row is CompletedEventInput => !!row);

  const finalizedEvents: FinalizedEventInput[] = finalizedRows.map((row) => ({
    sessionId: row.session_id,
    createdAt: row.created_at,
  }));

  const repeatAnalysis = buildRepeatAnalysis(committedEvents, { lookbackDays: 7, alertThreshold: 0.2 });
  const funnel = buildFunnelByFirstItem(committedEvents, completedEvents, finalizedEvents).slice(0, 12);

  const topRepeated = repeatAnalysis.itemRepeats
    .filter((row) => row.repeatedCount > 0)
    .slice(0, 20);

  const articleSlugs = Array.from(
    new Set(
      topRepeated
        .map((row) => hrefToArticleSlug(row.href))
        .filter((slug): slug is string => !!slug)
    )
  );

  let articleMetaBySlug = new Map<string, ArticleMeta>();
  if (articleSlugs.length > 0) {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from('LearningArticles')
      .select('slug, title, primary_concept, concept_tags')
      .in('slug', articleSlugs);

    articleMetaBySlug = new Map(
      ((data || []) as ArticleMeta[]).map((row) => [row.slug, row])
    );
  }

  const topRepeatedWithMeta = topRepeated.map((row) => {
    const slug = hrefToArticleSlug(row.href);
    const meta = slug ? articleMetaBySlug.get(slug) : null;
    const conceptTags = Array.isArray(meta?.concept_tags) ? meta?.concept_tags : [];
    return {
      ...row,
      title: meta?.title || row.href,
      slug,
      metadataFlags: {
        missingPrimaryConcept: !meta?.primary_concept,
        emptyConceptTags: conceptTags.length === 0,
      },
    };
  });

  const latestDaily = repeatAnalysis.daily[0] || null;
  const hasAlerts = repeatAnalysis.userDailyAlerts.length > 0;

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Admin Observability</p>
          <h1 className="mt-3 text-4xl font-bold text-text-primary">Session Recommendation Quality</h1>
          <p className="mt-3 text-text-secondary">
            Window: last 14 days. Repeat rule: item committed if seen by the same user in prior 7 days.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Latest Daily Repeat Rate</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">
              {latestDaily ? formatPercent(latestDaily.repeatRate) : '0.0%'}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {latestDaily ? `${latestDaily.repeatedCommitted}/${latestDaily.totalCommitted} committed items repeated` : 'No committed events yet'}
            </p>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Active Alert Days</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{repeatAnalysis.userDailyAlerts.length}</p>
            <p className="mt-1 text-xs text-text-muted">Threshold &gt; 20% user/day repeat rate</p>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
            <p className="text-xs uppercase tracking-wider text-text-muted">Tracked Committed Events</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{committedEvents.length}</p>
            <p className="mt-1 text-xs text-text-muted">Derived from `session_committed` telemetry</p>
          </div>
        </div>

        {hasAlerts && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            Alert: One or more user/day windows exceeded 20% repeat rate.
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Daily Repeat Rate</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Repeat Rate</th>
                    <th className="py-2">Repeated/Total</th>
                  </tr>
                </thead>
                <tbody>
                  {repeatAnalysis.daily.slice(0, 14).map((row) => (
                    <tr key={row.date} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.date}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.repeatRate)}</td>
                      <td className="py-2 text-text-secondary">{row.repeatedCommitted}/{row.totalCommitted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
            <h2 className="text-lg font-semibold text-text-primary mb-3">User/Day Alerts (&gt;20%)</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-text-muted">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">User</th>
                    <th className="py-2">Rate</th>
                    <th className="py-2">Repeated/Total</th>
                  </tr>
                </thead>
                <tbody>
                  {repeatAnalysis.userDailyAlerts.slice(0, 20).map((row) => (
                    <tr key={`${row.date}:${row.userKey}`} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.date}</td>
                      <td className="py-2 text-text-secondary">{row.userKey}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.repeatRate)}</td>
                      <td className="py-2 text-text-secondary">{row.repeatedCommitted}/{row.totalCommitted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Completion Funnel by First Item</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-text-muted">
                <tr>
                  <th className="py-2">First Item</th>
                  <th className="py-2">Committed</th>
                  <th className="py-2">Completed First</th>
                  <th className="py-2">Finalized</th>
                </tr>
              </thead>
              <tbody>
                {funnel.map((row) => (
                  <tr key={row.href} className="border-t border-border-subtle">
                    <td className="py-2 text-text-secondary">{row.href}</td>
                    <td className="py-2 text-text-primary">{row.committedSessions}</td>
                    <td className="py-2 text-text-primary">{row.completedFirstItemSessions}</td>
                    <td className="py-2 text-text-primary">{row.finalizedSessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Top Repeated Items (14d)</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-text-muted">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2">Repeat Rate</th>
                  <th className="py-2">Repeated/Total</th>
                  <th className="py-2">Metadata Flags</th>
                </tr>
              </thead>
              <tbody>
                {topRepeatedWithMeta.map((row) => {
                  const flags = [
                    row.metadataFlags.missingPrimaryConcept ? 'missing_primary_concept' : null,
                    row.metadataFlags.emptyConceptTags ? 'empty_concept_tags' : null,
                  ].filter(Boolean);

                  return (
                    <tr key={row.href} className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">{row.title}</td>
                      <td className="py-2 text-text-primary">{formatPercent(row.repeatRate)}</td>
                      <td className="py-2 text-text-secondary">{row.repeatedCount}/{row.totalCommitted}</td>
                      <td className="py-2 text-text-secondary">{flags.length > 0 ? flags.join(', ') : 'ok'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
