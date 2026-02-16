import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import {
  generateFrictionTriageBriefAction,
  recommendAndApplyFrictionTriageAction,
  upsertFrictionTriageAction,
} from '@/app/actions/friction-triage';
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
import {
  buildFrictionMonitorMetrics,
  type FrictionSnapshotInput,
} from '@/lib/friction-monitor';
import type { FrictionState, FrictionTrigger, FrictionTriageStatus } from '@/types/friction';

export const dynamic = 'force-dynamic';

type TelemetryRow = {
  email: string;
  google_id: string | null;
  track_slug: string;
  session_id: string;
  created_at: string;
  payload: Record<string, unknown> | null;
};

type SnapshotRow = {
  email: string;
  google_id: string | null;
  session_id: string;
  created_at: string;
  track_slug: string;
  step_index: number;
  friction_state: FrictionState;
  trigger: FrictionTrigger;
  confidence: number | string;
};

type FrictionDrilldownSnapshot = {
  createdAt: string;
  email: string;
  googleId: string | null;
  sessionId: string;
  trackSlug: string;
  stepIndex: number;
  frictionState: FrictionState;
  trigger: FrictionTrigger;
  confidence: number;
};

type DrilldownTelemetryRow = {
  created_at: string;
  event_type: string;
  session_id: string;
  payload: Record<string, unknown> | null;
};

type FrictionTriageRow = {
  track_slug: string;
  step_index: number;
  status: FrictionTriageStatus;
  owner: string | null;
  notes: string | null;
  updated_at: string;
  updated_by_email: string;
};

type FrictionTriageAuditRow = {
  created_at: string;
  action_type: 'manual_update' | 'ai_brief' | 'ai_recommendation' | 'ai_auto_batch';
  actor_email: string;
  before_status: string | null;
  before_owner: string | null;
  before_notes: string | null;
  after_status: string | null;
  after_owner: string | null;
  after_notes: string | null;
  rationale: string | null;
  metadata: Record<string, unknown> | null;
};

type IntelligenceTab = 'quality' | 'friction';
type RangeKey = '1d' | '7d' | '14d' | '30d';
type TrackKey = 'all' | string;
type QueueStatusKey = 'open' | 'all' | FrictionTriageStatus;
type QueueOwnerKey = 'all' | 'unassigned' | string;

const RANGE_DAYS: Record<RangeKey, number> = {
  '1d': 1,
  '7d': 7,
  '14d': 14,
  '30d': 30,
};

const DEFAULT_TRACKS = ['all', 'dsa', 'job-hunt', 'system-design'] as const;
const TRIAGE_STATUSES: FrictionTriageStatus[] = ['new', 'investigating', 'resolved'];

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function buildUserKey(email: string, googleId: string | null): string {
  return googleId ? `${email} (${googleId.slice(0, 8)}...)` : email;
}

function stateBadgeClass(state: FrictionState): string {
  if (state === 'stuck') return 'text-red-300';
  if (state === 'fatigue') return 'text-amber-300';
  if (state === 'drift') return 'text-yellow-300';
  if (state === 'coast') return 'text-blue-300';
  return 'text-emerald-300';
}

function triageBadgeClass(status: FrictionTriageStatus): string {
  if (status === 'resolved') return 'text-emerald-300';
  if (status === 'investigating') return 'text-amber-300';
  return 'text-red-300';
}

function triageKey(trackSlug: string, stepIndex: number): string {
  return `${trackSlug}:${stepIndex}`;
}

function parseTab(raw: string | string[] | undefined): IntelligenceTab {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'friction' ? 'friction' : 'quality';
}

function parseRange(raw: string | string[] | undefined): RangeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === '1d' || value === '7d' || value === '14d' || value === '30d') {
    return value;
  }
  return '14d';
}

function parseTrack(raw: string | string[] | undefined): TrackKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value === 'all') return 'all';
  if (!/^[a-z0-9-]+$/.test(value)) return 'all';
  return value;
}

function parseFocusTrack(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  if (!/^[a-z0-9-]+$/.test(value)) return null;
  return value;
}

function parseFocusStep(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) return null;
  return parsed;
}

function parseTriageStatus(raw: FormDataEntryValue | null): FrictionTriageStatus {
  const value = typeof raw === 'string' ? raw : '';
  if (value === 'investigating' || value === 'resolved') {
    return value;
  }
  return 'new';
}

function parseQueueStatus(raw: string | string[] | undefined): QueueStatusKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'all' || value === 'new' || value === 'investigating' || value === 'resolved') {
    return value;
  }
  return 'open';
}

function parseQueueOwner(raw: string | string[] | undefined): QueueOwnerKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value === 'all') return 'all';
  if (value === 'unassigned') return 'unassigned';
  if (!/^[a-z0-9@._+\- ]+$/i.test(value)) return 'all';
  return value.toLowerCase();
}

function buildLink(params: {
  tab: IntelligenceTab;
  range: RangeKey;
  track: TrackKey;
  focusTrack?: string | null;
  focusStep?: number | null;
  queueStatus?: QueueStatusKey;
  queueOwner?: QueueOwnerKey;
}): string {
  const query = new URLSearchParams();
  query.set('tab', params.tab);
  query.set('range', params.range);
  query.set('track', params.track);
  if (params.focusTrack) query.set('focusTrack', params.focusTrack);
  if (typeof params.focusStep === 'number') query.set('focusStep', String(params.focusStep));
  if (params.queueStatus) query.set('queueStatus', params.queueStatus);
  if (params.queueOwner) query.set('queueOwner', params.queueOwner);
  return `/admin/session-intelligence?${query.toString()}`;
}

function displayTrackLabel(track: TrackKey): string {
  if (track === 'all') return 'all';
  return track.replace(/-/g, ' ');
}

async function fetchTelemetryRows(eventType: string, sinceIso: string, track: TrackKey): Promise<TelemetryRow[]> {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from('TelemetryEvents')
    .select('email, google_id, track_slug, session_id, created_at, payload')
    .eq('event_type', eventType)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })
    .limit(5000);

  if (track !== 'all') {
    query = query.eq('track_slug', track);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as TelemetryRow[];
}

async function fetchFrictionSnapshots(sinceIso: string, track: TrackKey): Promise<FrictionSnapshotInput[]> {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from('SessionFrictionSnapshots')
    .select('email, google_id, session_id, created_at, track_slug, step_index, friction_state, trigger, confidence')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })
    .limit(5000);

  if (track !== 'all') {
    query = query.eq('track_slug', track);
  }

  const { data } = await query;

  return ((data || []) as SnapshotRow[]).map((row) => ({
    createdAt: row.created_at,
    trackSlug: row.track_slug,
    stepIndex: row.step_index,
    frictionState: row.friction_state,
    trigger: row.trigger,
    confidence: Number(row.confidence),
  }));
}

async function fetchFrictionDrilldown(
  sinceIso: string,
  trackSlug: string,
  stepIndex: number
): Promise<{ snapshots: FrictionDrilldownSnapshot[]; telemetry: DrilldownTelemetryRow[] }> {
  const admin = getSupabaseAdminClient();
  const { data: rawSnapshots } = await admin
    .from('SessionFrictionSnapshots')
    .select('created_at, email, google_id, session_id, track_slug, step_index, friction_state, trigger, confidence')
    .eq('track_slug', trackSlug)
    .eq('step_index', stepIndex)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(120);

  const snapshots = ((rawSnapshots || []) as SnapshotRow[]).map((row) => ({
    createdAt: row.created_at,
    email: row.email,
    googleId: row.google_id,
    sessionId: row.session_id,
    trackSlug: row.track_slug,
    stepIndex: row.step_index,
    frictionState: row.friction_state,
    trigger: row.trigger,
    confidence: Number(row.confidence),
  }));

  const sessionIds = Array.from(new Set(snapshots.map((snapshot) => snapshot.sessionId))).slice(0, 60);
  if (sessionIds.length === 0) {
    return { snapshots, telemetry: [] };
  }

  const { data: telemetryRows } = await admin
    .from('TelemetryEvents')
    .select('created_at, event_type, session_id, payload')
    .in('session_id', sessionIds)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(300);

  return { snapshots, telemetry: (telemetryRows || []) as DrilldownTelemetryRow[] };
}

async function fetchFrictionTriageRows(track: TrackKey): Promise<FrictionTriageRow[]> {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from('SessionFrictionTriage')
    .select('track_slug, step_index, status, owner, notes, updated_at, updated_by_email')
    .order('updated_at', { ascending: false })
    .limit(500);

  if (track !== 'all') {
    query = query.eq('track_slug', track);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as FrictionTriageRow[];
}

async function fetchFrictionTriageAuditRows(trackSlug: string, stepIndex: number): Promise<FrictionTriageAuditRow[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('SessionFrictionTriageAudit')
    .select('created_at, action_type, actor_email, before_status, before_owner, before_notes, after_status, after_owner, after_notes, rationale, metadata')
    .eq('track_slug', trackSlug)
    .eq('step_index', stepIndex)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !data) return [];
  return data as FrictionTriageAuditRow[];
}

export default async function SessionIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string | string[];
    range?: string | string[];
    track?: string | string[];
    focusTrack?: string | string[];
    focusStep?: string | string[];
    queueStatus?: string | string[];
    queueOwner?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user?.role as UserRole | undefined) ?? UserRole.USER;

  if (!session?.user?.email) {
    redirect('/');
  }

  if (!hasRole(userRole, UserRole.ADMIN)) {
    redirect('/home');
  }

  const resolvedParams = await searchParams;
  const tab = parseTab(resolvedParams?.tab);
  const range = parseRange(resolvedParams?.range);
  const track = parseTrack(resolvedParams?.track);
  const focusTrack = parseFocusTrack(resolvedParams?.focusTrack);
  const focusStep = parseFocusStep(resolvedParams?.focusStep);
  const queueStatus = parseQueueStatus(resolvedParams?.queueStatus);
  const queueOwner = parseQueueOwner(resolvedParams?.queueOwner);

  const now = Date.now();
  const sinceIso = new Date(now - RANGE_DAYS[range] * 24 * 60 * 60 * 1000).toISOString();

  const [committedRows, completedRows, finalizedRows, frictionSnapshots, frictionTriageRows] = await Promise.all([
    fetchTelemetryRows('session_committed', sinceIso, track),
    fetchTelemetryRows('item_completed', sinceIso, track),
    fetchTelemetryRows('session_finalized', sinceIso, track),
    fetchFrictionSnapshots(sinceIso, track),
    fetchFrictionTriageRows(track),
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
  const repeatedItems = repeatAnalysis.itemRepeats.filter((item) => item.repeatedCount > 0).slice(0, 12);

  const frictionMetrics = buildFrictionMonitorMetrics(frictionSnapshots, { alertThreshold: 0.3, hotspotMinSamples: 3 });
  const triageByHotspot = new Map(
    frictionTriageRows.map((row) => [triageKey(row.track_slug, row.step_index), row] as const)
  );
  const hotspotsWithTriage = frictionMetrics.hotspots
    .map((row) => {
      const triage = triageByHotspot.get(triageKey(row.trackSlug, row.stepIndex));
      const status = triage?.status ?? 'new';
      const owner = triage?.owner?.trim().toLowerCase() || null;
      const riskScore = row.stuckRate * row.total;
      return {
        ...row,
        status,
        owner,
        notes: triage?.notes ?? null,
        updatedAt: triage?.updated_at ?? null,
        updatedByEmail: triage?.updated_by_email ?? null,
        riskScore,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const queueOwnerOptions = Array.from(
    new Set(hotspotsWithTriage.map((row) => row.owner).filter((owner): owner is string => !!owner))
  ).sort();

  const triageQueueRows = hotspotsWithTriage.filter((row) => {
    const statusMatches =
      queueStatus === 'open'
        ? row.status !== 'resolved'
        : queueStatus === 'all'
          ? true
          : row.status === queueStatus;
    const ownerMatches =
      queueOwner === 'all'
        ? true
        : queueOwner === 'unassigned'
          ? !row.owner
          : row.owner === queueOwner;
    return statusMatches && ownerMatches;
  });

  const dynamicTracks = Array.from(
    new Set([
      ...committedRows.map((row) => row.track_slug),
      ...frictionSnapshots.map((row) => row.trackSlug),
    ].filter((value) => typeof value === 'string' && value.length > 0))
  ).sort();
  const trackOptions = Array.from(new Set<string>([...DEFAULT_TRACKS, ...dynamicTracks]));

  const shouldLoadFrictionDrilldown = tab === 'friction' && !!focusTrack && typeof focusStep === 'number';
  const [frictionDrilldown, frictionTriageAuditRows] = shouldLoadFrictionDrilldown
    ? await Promise.all([
        fetchFrictionDrilldown(sinceIso, focusTrack, focusStep),
        fetchFrictionTriageAuditRows(focusTrack, focusStep),
      ])
    : [null, [] as FrictionTriageAuditRow[]];
  const focusedTriage = shouldLoadFrictionDrilldown && focusTrack && typeof focusStep === 'number'
    ? triageByHotspot.get(triageKey(focusTrack, focusStep)) ?? null
    : null;

  async function saveFrictionTriage(formData: FormData) {
    'use server';

    const trackSlug = typeof formData.get('trackSlug') === 'string' ? String(formData.get('trackSlug')) : '';
    const stepIndexRaw = typeof formData.get('stepIndex') === 'string' ? String(formData.get('stepIndex')) : '';
    const stepIndex = Number(stepIndexRaw);

    if (!trackSlug || !Number.isInteger(stepIndex)) {
      return;
    }

    await upsertFrictionTriageAction({
      trackSlug,
      stepIndex,
      status: parseTriageStatus(formData.get('status')),
      owner: typeof formData.get('owner') === 'string' ? String(formData.get('owner')) : null,
      notes: typeof formData.get('notes') === 'string' ? String(formData.get('notes')) : null,
    });
  }

  async function generateAIBrief(formData: FormData) {
    'use server';

    const trackSlug = typeof formData.get('trackSlug') === 'string' ? String(formData.get('trackSlug')) : '';
    const stepIndexRaw = typeof formData.get('stepIndex') === 'string' ? String(formData.get('stepIndex')) : '';
    const stepIndex = Number(stepIndexRaw);

    if (!trackSlug || !Number.isInteger(stepIndex)) {
      return;
    }

    await generateFrictionTriageBriefAction({
      trackSlug,
      stepIndex,
      lookbackDays: RANGE_DAYS[range],
    });
  }

  async function recommendAndApplyAITriage(formData: FormData) {
    'use server';

    const trackSlug = typeof formData.get('trackSlug') === 'string' ? String(formData.get('trackSlug')) : '';
    const stepIndexRaw = typeof formData.get('stepIndex') === 'string' ? String(formData.get('stepIndex')) : '';
    const stepIndex = Number(stepIndexRaw);

    if (!trackSlug || !Number.isInteger(stepIndex)) {
      return;
    }

    await recommendAndApplyFrictionTriageAction({
      trackSlug,
      stepIndex,
      lookbackDays: RANGE_DAYS[range],
      source: 'ai_recommendation',
    });
  }

  async function autoTriageTopQueue(formData: FormData) {
    'use server';

    const targetsRaw = typeof formData.get('targets') === 'string' ? String(formData.get('targets')) : '[]';
    let parsed: unknown;
    try {
      parsed = JSON.parse(targetsRaw);
    } catch {
      parsed = [];
    }

    const targets = Array.isArray(parsed)
      ? parsed
          .map((row) => {
            if (!row || typeof row !== 'object') return null;
            const trackSlug = 'trackSlug' in row && typeof row.trackSlug === 'string' ? row.trackSlug : null;
            const stepIndex = 'stepIndex' in row && Number.isInteger(row.stepIndex) ? row.stepIndex : null;
            if (!trackSlug || stepIndex === null) return null;
            return { trackSlug, stepIndex };
          })
          .filter((row): row is { trackSlug: string; stepIndex: number } => !!row)
          .slice(0, 5)
      : [];

    for (const target of targets) {
      await recommendAndApplyFrictionTriageAction({
        trackSlug: target.trackSlug,
        stepIndex: target.stepIndex,
        lookbackDays: RANGE_DAYS[range],
        source: 'ai_auto_batch',
      });
    }
  }

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <section className="mx-auto max-w-7xl px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-text-muted">Admin Observability</p>
          <h1 className="mt-3 text-4xl font-bold text-text-primary">Session Intelligence</h1>
          <p className="mt-2 text-text-secondary">Unified dashboard for recommendation quality and friction telemetry.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-border-subtle bg-surface-interactive px-3 py-1 text-text-secondary">Range: {range}</span>
            <span className="rounded-full border border-border-subtle bg-surface-interactive px-3 py-1 text-text-secondary">Track: {displayTrackLabel(track)}</span>
          </div>
        </div>

        <div className="mb-4 inline-flex rounded-xl border border-border-subtle bg-surface-interactive p-1">
          <Link
            href={buildLink({ tab: 'quality', range, track, queueStatus, queueOwner })}
            className={`rounded-lg px-4 py-2 text-sm ${tab === 'quality' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Recommendation Quality
          </Link>
          <Link
            href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner })}
            className={`rounded-lg px-4 py-2 text-sm ${tab === 'friction' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Friction Monitor
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['1d', '7d', '14d', '30d'] as RangeKey[]).map((option) => (
            <Link
              key={option}
              href={buildLink({ tab, range: option, track, focusTrack, focusStep, queueStatus, queueOwner })}
              className={`rounded-full border px-3 py-1 text-xs ${option === range ? 'border-border-interactive text-text-primary bg-surface-interactive' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-interactive'}`}
            >
              {option}
            </Link>
          ))}
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {trackOptions.map((option) => (
            <Link
              key={option}
              href={buildLink({
                tab,
                range,
                track: option,
                focusTrack: option === focusTrack ? focusTrack : null,
                focusStep: option === focusTrack ? focusStep : null,
                queueStatus,
                queueOwner,
              })}
              className={`rounded-full border px-3 py-1 text-xs ${option === track ? 'border-border-interactive text-text-primary bg-surface-interactive' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-interactive'}`}
            >
              {displayTrackLabel(option)}
            </Link>
          ))}
        </div>

        {tab === 'quality' ? (
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <p className="text-xs uppercase tracking-wider text-text-muted">Latest Daily Repeat Rate</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {repeatAnalysis.daily[0] ? formatPercent(repeatAnalysis.daily[0].repeatRate) : '0.0%'}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <p className="text-xs uppercase tracking-wider text-text-muted">User/Day Alerts (&gt;20%)</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{repeatAnalysis.userDailyAlerts.length}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <p className="text-xs uppercase tracking-wider text-text-muted">Tracked Commits ({range})</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{committedEvents.length}</p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <h2 className="text-lg font-semibold text-text-primary mb-3">Daily Repeat Rate</h2>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-text-muted"><tr><th className="py-2">Date</th><th className="py-2">Rate</th><th className="py-2">Repeated/Total</th></tr></thead>
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
                <h2 className="text-lg font-semibold text-text-primary mb-3">Top Repeated First Items</h2>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-text-muted"><tr><th className="py-2">Href</th><th className="py-2">Rate</th><th className="py-2">Repeated/Total</th></tr></thead>
                    <tbody>
                      {repeatedItems.map((row) => (
                        <tr key={row.href} className="border-t border-border-subtle">
                          <td className="py-2 text-text-secondary">{row.href}</td>
                          <td className="py-2 text-text-primary">{formatPercent(row.repeatRate)}</td>
                          <td className="py-2 text-text-secondary">{row.repeatedCount}/{row.totalCommitted}</td>
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
                  <thead className="text-left text-text-muted"><tr><th className="py-2">First Item</th><th className="py-2">Committed</th><th className="py-2">Completed</th><th className="py-2">Finalized</th></tr></thead>
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
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <p className="text-xs uppercase tracking-wider text-text-muted">Total Snapshots ({range})</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{frictionMetrics.totalSnapshots}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <p className="text-xs uppercase tracking-wider text-text-muted">Latest Daily Stuck Share</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {frictionMetrics.dailyStuck[0] ? formatPercent(frictionMetrics.dailyStuck[0].stuckRate) : '0.0%'}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <p className="text-xs uppercase tracking-wider text-text-muted">Daily Alerts (&gt;30% stuck)</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{frictionMetrics.dailyAlerts.length}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <p className="text-xs uppercase tracking-wider text-text-muted">Open Hotspots</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {hotspotsWithTriage.filter((row) => row.status !== 'resolved').length}
                </p>
              </div>
            </div>

            <section className="mb-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-text-primary">Triage Queue</h2>
                <p className="text-xs text-text-muted">Sorted by risk score (stuck share * sample size)</p>
              </div>

              <form action={autoTriageTopQueue} className="mb-4">
                <input
                  type="hidden"
                  name="targets"
                  value={JSON.stringify(
                    triageQueueRows.slice(0, 5).map((row) => ({
                      trackSlug: row.trackSlug,
                      stepIndex: row.stepIndex,
                    }))
                  )}
                />
                <button
                  type="submit"
                  className="rounded-full border border-emerald-700/60 bg-emerald-950/30 px-4 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={triageQueueRows.length === 0}
                >
                  AI Auto-triage Top 5
                </button>
              </form>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                {(['open', 'all', 'new', 'investigating', 'resolved'] as QueueStatusKey[]).map((status) => (
                  <Link
                    key={status}
                    href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus: status, queueOwner })}
                    className={`rounded-full border px-3 py-1 text-xs ${queueStatus === status ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                  >
                    {status}
                  </Link>
                ))}
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Link
                  href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner: 'all' })}
                  className={`rounded-full border px-3 py-1 text-xs ${queueOwner === 'all' ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                >
                  all owners
                </Link>
                <Link
                  href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner: 'unassigned' })}
                  className={`rounded-full border px-3 py-1 text-xs ${queueOwner === 'unassigned' ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                >
                  unassigned
                </Link>
                {queueOwnerOptions.map((owner) => (
                  <Link
                    key={owner}
                    href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner: owner })}
                    className={`rounded-full border px-3 py-1 text-xs ${queueOwner === owner ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                  >
                    {owner}
                  </Link>
                ))}
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted"><tr><th className="py-2">Track</th><th className="py-2">Step</th><th className="py-2">Status</th><th className="py-2">Owner</th><th className="py-2">Risk</th><th className="py-2">Stuck Share</th><th className="py-2">Samples</th><th className="py-2">Inspect</th></tr></thead>
                  <tbody>
                    {triageQueueRows.slice(0, 30).map((row) => (
                      <tr key={`queue:${row.trackSlug}:${row.stepIndex}`} className="border-t border-border-subtle">
                        <td className="py-2 text-text-secondary">{row.trackSlug}</td>
                        <td className="py-2 text-text-secondary">{row.stepIndex}</td>
                        <td className={`py-2 font-medium ${triageBadgeClass(row.status)}`}>{row.status}</td>
                        <td className="py-2 text-text-secondary">{row.owner || 'unassigned'}</td>
                        <td className="py-2 text-text-primary">{row.riskScore.toFixed(2)}</td>
                        <td className="py-2 text-text-secondary">{formatPercent(row.stuckRate)}</td>
                        <td className="py-2 text-text-secondary">{row.total}</td>
                        <td className="py-2">
                          <Link
                            href={buildLink({
                              tab: 'friction',
                              range,
                              track,
                              focusTrack: row.trackSlug,
                              focusStep: row.stepIndex,
                              queueStatus,
                              queueOwner,
                            })}
                            className="text-xs text-cyan-300 hover:text-cyan-200"
                          >
                            View sessions
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {triageQueueRows.length === 0 && (
                      <tr className="border-t border-border-subtle">
                        <td className="py-3 text-text-muted" colSpan={8}>No hotspots match this queue filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <h2 className="text-lg font-semibold text-text-primary mb-3">State Distribution</h2>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-text-muted"><tr><th className="py-2">State</th><th className="py-2">Share</th><th className="py-2">Count</th></tr></thead>
                    <tbody>
                      {frictionMetrics.stateDistribution.map((row) => (
                        <tr key={row.state} className="border-t border-border-subtle">
                          <td className={`py-2 font-medium ${stateBadgeClass(row.state)}`}>{row.state}</td>
                          <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                          <td className="py-2 text-text-secondary">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <h2 className="text-lg font-semibold text-text-primary mb-3">Trigger Split</h2>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-text-muted"><tr><th className="py-2">Trigger</th><th className="py-2">Share</th><th className="py-2">Count</th></tr></thead>
                    <tbody>
                      {frictionMetrics.triggerDistribution.map((row) => (
                        <tr key={row.trigger} className="border-t border-border-subtle">
                          <td className="py-2 text-text-secondary">{row.trigger}</td>
                          <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                          <td className="py-2 text-text-secondary">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <section className="mt-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
              <h2 className="text-lg font-semibold text-text-primary mb-3">Top Stuck Hotspots</h2>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted"><tr><th className="py-2">Track</th><th className="py-2">Step</th><th className="py-2">Status</th><th className="py-2">Stuck Share</th><th className="py-2">Stuck/Total</th><th className="py-2">Inspect</th></tr></thead>
                  <tbody>
                    {hotspotsWithTriage.slice(0, 20).map((row) => {
                      return (
                        <tr key={`${row.trackSlug}:${row.stepIndex}`} className="border-t border-border-subtle">
                          <td className="py-2 text-text-secondary">{row.trackSlug}</td>
                          <td className="py-2 text-text-secondary">{row.stepIndex}</td>
                          <td className={`py-2 font-medium ${triageBadgeClass(row.status)}`}>{row.status}</td>
                          <td className="py-2 text-text-primary">{formatPercent(row.stuckRate)}</td>
                          <td className="py-2 text-text-secondary">{row.stuckCount}/{row.total}</td>
                          <td className="py-2">
                            <Link
                              href={buildLink({
                                tab: 'friction',
                                range,
                                track,
                                focusTrack: row.trackSlug,
                                focusStep: row.stepIndex,
                                queueStatus,
                                queueOwner,
                              })}
                              className="text-xs text-cyan-300 hover:text-cyan-200"
                            >
                              View sessions
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {frictionDrilldown && (
              <section className="mt-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Hotspot Drill-down</h2>
                    <p className="text-sm text-text-secondary">
                      {displayTrackLabel(frictionDrilldown.snapshots[0]?.trackSlug || focusTrack || 'unknown')}
                      {' '}step {frictionDrilldown.snapshots[0]?.stepIndex ?? focusStep}
                    </p>
                  </div>
                  <Link
                    href={buildLink({ tab: 'friction', range, track, queueStatus, queueOwner })}
                    className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-secondary hover:bg-surface"
                  >
                    Clear
                  </Link>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border-subtle bg-surface p-3">
                    <p className="text-xs uppercase tracking-wider text-text-muted">Snapshots</p>
                    <p className="mt-1 text-xl font-semibold text-text-primary">{frictionDrilldown.snapshots.length}</p>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-surface p-3">
                    <p className="text-xs uppercase tracking-wider text-text-muted">Unique Sessions</p>
                    <p className="mt-1 text-xl font-semibold text-text-primary">{new Set(frictionDrilldown.snapshots.map((row) => row.sessionId)).size}</p>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-surface p-3">
                    <p className="text-xs uppercase tracking-wider text-text-muted">Linked Telemetry Events</p>
                    <p className="mt-1 text-xl font-semibold text-text-primary">{frictionDrilldown.telemetry.length}</p>
                  </div>
                </div>

                <section className="mb-6 rounded-lg border border-border-subtle bg-surface p-4">
                  <h3 className="mb-3 text-sm font-semibold text-text-primary">Triage</h3>
                  <form action={generateAIBrief} className="mb-3">
                    <input type="hidden" name="trackSlug" value={focusTrack ?? ''} />
                    <input type="hidden" name="stepIndex" value={String(focusStep ?? '')} />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        className="rounded-full border border-cyan-700/60 bg-cyan-950/30 px-4 py-1.5 text-xs text-cyan-200 hover:bg-cyan-900/40"
                      >
                        Generate AI Brief
                      </button>
                    </div>
                  </form>
                  <form action={recommendAndApplyAITriage} className="mb-3">
                    <input type="hidden" name="trackSlug" value={focusTrack ?? ''} />
                    <input type="hidden" name="stepIndex" value={String(focusStep ?? '')} />
                    <button
                      type="submit"
                      className="rounded-full border border-emerald-700/60 bg-emerald-950/30 px-4 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900/40"
                    >
                      AI Recommend Owner + Status
                    </button>
                  </form>
                  <form action={saveFrictionTriage} className="grid gap-3 md:grid-cols-3">
                    <input type="hidden" name="trackSlug" value={focusTrack ?? ''} />
                    <input type="hidden" name="stepIndex" value={String(focusStep ?? '')} />
                    <label className="text-xs text-text-muted">
                      Status
                      <select
                        name="status"
                        defaultValue={focusedTriage?.status ?? 'new'}
                        className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary"
                      >
                        {TRIAGE_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-text-muted">
                      Owner
                      <input
                        name="owner"
                        defaultValue={focusedTriage?.owner ?? ''}
                        placeholder="owner name or email"
                        className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                      />
                    </label>
                    <label className="text-xs text-text-muted md:col-span-3">
                      Notes
                      <textarea
                        name="notes"
                        defaultValue={focusedTriage?.notes ?? ''}
                        rows={3}
                        placeholder="What is happening and next action?"
                        className="mt-1 w-full rounded-lg border border-border-subtle bg-surface-interactive px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                      />
                    </label>
                    <div className="md:col-span-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <button
                        type="submit"
                        className="rounded-full border border-border-interactive bg-surface-interactive px-4 py-1.5 text-text-primary hover:bg-surface"
                      >
                        Save triage
                      </button>
                      {focusedTriage ? (
                        <span>Last updated {new Date(focusedTriage.updated_at).toLocaleString()} by {focusedTriage.updated_by_email}</span>
                      ) : (
                        <span>No triage record yet for this hotspot.</span>
                      )}
                    </div>
                  </form>
                </section>

                <section className="mb-6 rounded-lg border border-border-subtle bg-surface p-4">
                  <h3 className="mb-3 text-sm font-semibold text-text-primary">Triage Audit Timeline</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-text-muted">
                        <tr>
                          <th className="py-2">Time</th>
                          <th className="py-2">Action</th>
                          <th className="py-2">Actor</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Owner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {frictionTriageAuditRows.map((row) => (
                          <tr key={`${row.created_at}:${row.action_type}:${row.actor_email}`} className="border-t border-border-subtle">
                            <td className="py-2 text-text-secondary">{new Date(row.created_at).toLocaleString()}</td>
                            <td className="py-2 text-text-primary">{row.action_type}</td>
                            <td className="py-2 text-text-secondary">{row.actor_email}</td>
                            <td className="py-2 text-text-secondary">{`${row.before_status || '-'} -> ${row.after_status || '-'}`}</td>
                            <td className="py-2 text-text-secondary">{`${row.before_owner || 'unassigned'} -> ${row.after_owner || 'unassigned'}`}</td>
                          </tr>
                        ))}
                        {frictionTriageAuditRows.length === 0 && (
                          <tr className="border-t border-border-subtle">
                            <td className="py-3 text-text-muted" colSpan={5}>No audit entries yet for this hotspot.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section>
                    <h3 className="mb-2 text-sm font-semibold text-text-primary">Recent Friction Snapshots</h3>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-text-muted"><tr><th className="py-2">Time</th><th className="py-2">User</th><th className="py-2">Session</th><th className="py-2">State</th><th className="py-2">Trigger</th><th className="py-2">Conf.</th></tr></thead>
                        <tbody>
                          {frictionDrilldown.snapshots.slice(0, 20).map((row) => (
                            <tr key={`${row.sessionId}:${row.createdAt}:${row.trigger}:${row.frictionState}`} className="border-t border-border-subtle">
                              <td className="py-2 text-text-secondary">{new Date(row.createdAt).toLocaleString()}</td>
                              <td className="py-2 text-text-secondary">{buildUserKey(row.email, row.googleId)}</td>
                              <td className="py-2 text-text-secondary">{row.sessionId.slice(0, 10)}...</td>
                              <td className={`py-2 font-medium ${stateBadgeClass(row.frictionState)}`}>{row.frictionState}</td>
                              <td className="py-2 text-text-secondary">{row.trigger}</td>
                              <td className="py-2 text-text-primary">{row.confidence.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-2 text-sm font-semibold text-text-primary">Recent Linked Telemetry</h3>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-text-muted"><tr><th className="py-2">Time</th><th className="py-2">Event</th><th className="py-2">Session</th><th className="py-2">Item</th></tr></thead>
                        <tbody>
                          {frictionDrilldown.telemetry.slice(0, 30).map((row) => {
                            const itemHref = typeof row.payload?.itemHref === 'string'
                              ? normalizeTelemetryHref(row.payload.itemHref)
                              : null;
                            return (
                              <tr key={`${row.session_id}:${row.event_type}:${row.created_at}`} className="border-t border-border-subtle">
                                <td className="py-2 text-text-secondary">{new Date(row.created_at).toLocaleString()}</td>
                                <td className="py-2 text-text-primary">{row.event_type}</td>
                                <td className="py-2 text-text-secondary">{row.session_id.slice(0, 10)}...</td>
                                <td className="py-2 text-text-secondary">{itemHref || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
