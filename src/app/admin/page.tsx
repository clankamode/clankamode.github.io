import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { UserRole, hasRole } from '@/types/roles';

type AdminDestination = {
  id?: 'session-intelligence' | 'feedback' | 'friction-queue' | 'learning-content' | 'ai-tools' | 'thumbnails' | 'gallery' | 'clips';
  href: string;
  title: string;
  description: string;
  section: 'Dashboard' | 'Session Intelligence' | 'Content' | 'Operations';
  primary?: boolean;
};

const ADMIN_DESTINATIONS: AdminDestination[] = [
  {
    href: '/admin/dashboard',
    title: 'Dashboard',
    description: 'User statistics, daily signups, DAU, and user list with role management.',
    section: 'Dashboard',
  },
  {
    id: 'session-intelligence',
    href: '/admin/session-intelligence',
    title: 'Session Intelligence',
    description: 'Inspect sessions and decision quality.',
    section: 'Session Intelligence',
    primary: true,
  },
  {
    id: 'friction-queue',
    href: '/admin/session-intelligence?tab=friction',
    title: 'Friction Queue',
    description: 'Resolve friction hotspots.',
    section: 'Session Intelligence',
  },
  {
    id: 'learning-content',
    href: '/admin/content',
    title: 'Learning Content',
    description: 'Edit and publish curriculum.',
    section: 'Content',
  },
  {
    id: 'ai-tools',
    href: '/ai',
    title: 'AI Tools',
    description: 'Run generation jobs.',
    section: 'Operations',
  },
  {
    id: 'thumbnails',
    href: '/thumbnails',
    title: 'Thumbnails',
    description: 'Triage visual jobs.',
    section: 'Operations',
  },
  {
    id: 'gallery',
    href: '/gallery',
    title: 'Gallery',
    description: 'Review uploaded assets.',
    section: 'Operations',
  },
  {
    id: 'clips',
    href: '/clips',
    title: 'Clips',
    description: 'Prepare clips for publish.',
    section: 'Operations',
  },
  {
    id: 'feedback',
    href: '/admin/feedback',
    title: 'Feedback',
    description: 'View analytics and manage user feedback status.',
    section: 'Operations',
  },
  {
    href: '/admin/ama',
    title: 'Live Management',
    description: 'Manage AMA questions and resume reviews ranked by upvotes.',
    section: 'Operations',
  },
];

const SECTION_ORDER: AdminDestination['section'][] = [
  'Dashboard',
  'Session Intelligence',
  'Content',
  'Operations',
];

export const dynamic = 'force-dynamic';

export default async function AdminHubPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole) || UserRole.USER;

  if (!session || !hasRole(role, UserRole.EDITOR)) {
    redirect('/');
  }

  if (!hasRole(role, UserRole.ADMIN)) {
    redirect('/admin/content');
  }

  const admin = getSupabaseAdminClient();
  const since24h = new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString();
  const since14d = new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)).toISOString();

  const [
    frictionOpenRes,
    sessionCommittedRes,
    feedbackBugRes,
    feedbackTotalRes,
    aiRunningRes,
  ] = await Promise.all([
    admin
      .from('SessionFrictionTriage')
      .select('track_slug', { head: true, count: 'exact' })
      .neq('status', 'resolved'),
    admin
      .from('TelemetryEvents')
      .select('session_id')
      .eq('event_type', 'session_committed')
      .gte('created_at', since24h)
      .limit(5000),
    admin
      .from('UserFeedback')
      .select('id', { head: true, count: 'exact' })
      .eq('category', 'bug')
      .gte('created_at', since14d),
    admin
      .from('UserFeedback')
      .select('id', { head: true, count: 'exact' })
      .gte('created_at', since14d),
    admin
      .from('ThumbnailJob')
      .select('id', { head: true, count: 'exact' })
      .eq('thumbnail_suggestion_status', 'generating'),
  ]);

  const openHotspots = frictionOpenRes.count ?? 0;
  const activeSessions = new Set((sessionCommittedRes.data || []).map((row: { session_id: string }) => row.session_id)).size;
  const flaggedFeedback = feedbackBugRes.count ?? 0;
  const feedbackTotal = feedbackTotalRes.count ?? 0;
  const runningGenerationJobs = aiRunningRes.count ?? 0;

  const signalById: Record<NonNullable<AdminDestination['id']>, { value: number | null; label: string; tone: 'neutral' | 'warning' | 'danger' | 'active' }> = {
    'session-intelligence': { value: activeSessions, label: 'active sessions (24h)', tone: activeSessions > 0 ? 'active' : 'neutral' },
    'feedback': { value: flaggedFeedback, label: 'bug reports (14d)', tone: flaggedFeedback > 0 ? 'warning' : 'neutral' },
    'friction-queue': { value: openHotspots, label: 'open hotspots', tone: openHotspots > 0 ? 'danger' : 'neutral' },
    'learning-content': { value: null, label: 'content ops', tone: 'neutral' },
    'ai-tools': { value: runningGenerationJobs, label: 'jobs running', tone: runningGenerationJobs > 0 ? 'active' : 'neutral' },
    'thumbnails': { value: runningGenerationJobs, label: 'jobs running', tone: runningGenerationJobs > 0 ? 'active' : 'neutral' },
    'gallery': { value: null, label: 'asset review', tone: 'neutral' },
    'clips': { value: null, label: 'publish prep', tone: 'neutral' },
  };

  function signalClass(tone: 'neutral' | 'warning' | 'danger' | 'active'): string {
    if (tone === 'danger') return 'border-red-700/50 bg-red-950/40 text-red-300';
    if (tone === 'warning') return 'border-amber-700/50 bg-amber-950/40 text-amber-300';
    if (tone === 'active') return 'border-emerald-700/50 bg-emerald-950/40 text-emerald-300';
    return 'border-border-subtle bg-surface text-text-muted';
  }

  return (
    <div className="min-h-screen bg-background pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-7">
          <p className="text-xs uppercase tracking-[0.32em] text-text-muted">Admin</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-text-primary">System Console</h1>
          <p className="mt-2 max-w-2xl text-text-secondary">Review signals. Ship fixes. Publish changes.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-interactive px-3 py-1 text-xs text-text-secondary">
            <span>Feedback</span>
            <span className="font-semibold text-text-primary">{feedbackTotal}</span>
            <span className="text-text-muted">last 14d</span>
          </div>
        </div>

        <div className="space-y-5">
          {SECTION_ORDER.map((section) => {
            const items = ADMIN_DESTINATIONS.filter((destination) => destination.section === section);
            if (items.length === 0) {
              return null;
            }

            return (
              <section key={section}>
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-sm font-semibold tracking-wide text-text-primary/90">{section}</h2>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative overflow-hidden rounded-xl border bg-surface-workbench/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-interactive hover:bg-surface-workbench hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_12px_26px_rgba(0,0,0,0.32)] ${item.primary ? 'md:col-span-2 border-border-interactive/65 p-7' : 'border-border-subtle/80 p-4 opacity-90 hover:opacity-100'}`}
                    >
                      {item.primary && (
                        <div className="absolute left-0 top-0 h-full w-[3px] bg-emerald-500/70" />
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <p className={`font-semibold text-text-primary transition-colors group-hover:text-foreground ${item.primary ? 'text-2xl' : 'text-xl'}`}>
                          {item.title}
                        </p>
                        {item.id != null && signalById[item.id].value !== null && (
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${signalClass(signalById[item.id].tone)}`}>
                            {`${signalById[item.id].value} ${signalById[item.id].label}`}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
