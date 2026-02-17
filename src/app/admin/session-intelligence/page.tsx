import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import {
  generateFrictionTriageBriefAction,
  recommendAndApplyFrictionTriageAction,
  upsertFrictionTriageAction,
} from '@/app/actions/friction-triage';
import { reviewAIDecisionAction } from '@/app/actions/ai-decision-review';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { FeatureFlags, isFeatureEnabled } from '@/lib/flags';
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
import { buildAIDecisionReplaySummary } from '@/lib/session-ai-replay';
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

type AIDecisionRow = {
  id: string;
  created_at: string;
  decision_type: string;
  decision_mode: string;
  track_slug: string;
  step_index: number;
  actor_email: string;
  confidence: number | null;
  source: string;
  output_json: Record<string, unknown> | null;
};

type AIDecisionAuditRow = {
  created_at: string;
  action_type: string;
  track_slug: string;
  step_index: number;
  after_status: string | null;
  after_owner: string | null;
};

type IntelligenceTab = 'quality' | 'friction';
type RangeKey = '1d' | '7d' | '14d' | '30d';
type TrackKey = 'all' | string;
type QueueStatusKey = 'open' | 'all' | FrictionTriageStatus;
type QueueOwnerKey = 'all' | 'unassigned' | string;
type AIDecisionTypeKey = 'all' | 'triage_brief' | 'triage_recommendation';
type AIDecisionModeKey = 'all' | 'suggest' | 'assist' | 'auto';
type AIDecisionSourceKey = 'all' | 'session_intelligence' | 'ai_recommendation' | 'ai_auto_batch';
type AIDecisionOutcomeKey = 'all' | 'confirmed' | 'overridden' | 'inconclusive' | 'unreviewed';

const RANGE_DAYS: Record<RangeKey, number> = {
  '1d': 1,
  '7d': 7,
  '14d': 14,
  '30d': 30,
};

const DEFAULT_TRACKS = ['all', 'dsa', 'job-hunt', 'system-design'] as const;
const TRIAGE_STATUSES: FrictionTriageStatus[] = ['new', 'investigating', 'resolved'];
const AUTO_TRIAGE_MINUTES_COOLDOWN = 120;

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

function parseAIDecisionType(raw: string | string[] | undefined): AIDecisionTypeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'triage_brief' || value === 'triage_recommendation') return value;
  return 'all';
}

function parseAIDecisionMode(raw: string | string[] | undefined): AIDecisionModeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'suggest' || value === 'assist' || value === 'auto') return value;
  return 'all';
}

function parseAIDecisionSource(raw: string | string[] | undefined): AIDecisionSourceKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'session_intelligence' || value === 'ai_recommendation' || value === 'ai_auto_batch') return value;
  return 'all';
}

function parseAIDecisionOutcome(raw: string | string[] | undefined): AIDecisionOutcomeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'confirmed' || value === 'overridden' || value === 'inconclusive' || value === 'unreviewed') return value;
  return 'all';
}

function buildLink(params: {
  tab: IntelligenceTab;
  range: RangeKey;
  track: TrackKey;
  focusTrack?: string | null;
  focusStep?: number | null;
  queueStatus?: QueueStatusKey;
  queueOwner?: QueueOwnerKey;
  aiType?: AIDecisionTypeKey;
  aiMode?: AIDecisionModeKey;
  aiSource?: AIDecisionSourceKey;
  aiOutcome?: AIDecisionOutcomeKey;
}): string {
  const query = new URLSearchParams();
  query.set('tab', params.tab);
  query.set('range', params.range);
  query.set('track', params.track);
  if (params.focusTrack) query.set('focusTrack', params.focusTrack);
  if (typeof params.focusStep === 'number') query.set('focusStep', String(params.focusStep));
  if (params.queueStatus) query.set('queueStatus', params.queueStatus);
  if (params.queueOwner) query.set('queueOwner', params.queueOwner);
  if (params.aiType) query.set('aiType', params.aiType);
  if (params.aiMode) query.set('aiMode', params.aiMode);
  if (params.aiSource) query.set('aiSource', params.aiSource);
  if (params.aiOutcome) query.set('aiOutcome', params.aiOutcome);
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

async function fetchAIDecisionRows(sinceIso: string, track: TrackKey): Promise<AIDecisionRow[]> {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from('SessionAIDecisions')
    .select('id, created_at, decision_type, decision_mode, track_slug, step_index, actor_email, confidence, source, output_json')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(1500);

  if (track !== 'all') {
    query = query.eq('track_slug', track);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AIDecisionRow[];
}

async function fetchAIDecisionAuditRows(sinceIso: string, track: TrackKey): Promise<AIDecisionAuditRow[]> {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from('SessionFrictionTriageAudit')
    .select('created_at, action_type, track_slug, step_index, after_status, after_owner')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })
    .limit(5000);

  if (track !== 'all') {
    query = query.eq('track_slug', track);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as AIDecisionAuditRow[];
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
    aiType?: string | string[];
    aiMode?: string | string[];
    aiSource?: string | string[];
    aiOutcome?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user?.role as UserRole | undefined) ?? UserRole.USER;
  const autoTriageEnabled = isFeatureEnabled(FeatureFlags.AI_TRIAGE_AUTOMATION, session?.user ?? null);

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
  const aiType = parseAIDecisionType(resolvedParams?.aiType);
  const aiMode = parseAIDecisionMode(resolvedParams?.aiMode);
  const aiSource = parseAIDecisionSource(resolvedParams?.aiSource);
  const aiOutcome = parseAIDecisionOutcome(resolvedParams?.aiOutcome);

  const now = Date.now();
  const sinceIso = new Date(now - RANGE_DAYS[range] * 24 * 60 * 60 * 1000).toISOString();

  const [
    committedRows,
    completedRows,
    finalizedRows,
    frictionSnapshots,
    frictionTriageRows,
    aiDecisionRows,
    aiAuditRows,
    firstWinShownRows,
    firstWinGoalRows,
    firstWinPlanRows,
    firstWinLaunchRows,
  ] = await Promise.all([
    fetchTelemetryRows('session_committed', sinceIso, track),
    fetchTelemetryRows('item_completed', sinceIso, track),
    fetchTelemetryRows('session_finalized', sinceIso, track),
    fetchFrictionSnapshots(sinceIso, track),
    fetchFrictionTriageRows(track),
    fetchAIDecisionRows(sinceIso, track),
    fetchAIDecisionAuditRows(sinceIso, track),
    fetchTelemetryRows('first_win_run_shown', sinceIso, 'onboarding'),
    fetchTelemetryRows('first_win_goal_selected', sinceIso, 'onboarding'),
    fetchTelemetryRows('first_win_plan_generated', sinceIso, 'onboarding'),
    fetchTelemetryRows('first_win_launched', sinceIso, 'onboarding'),
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
  const onboardingShownSessions = new Set(firstWinShownRows.map((row) => row.session_id));
  const onboardingGoalSessions = new Set(firstWinGoalRows.map((row) => row.session_id));
  const onboardingPlanSessions = new Set(firstWinPlanRows.map((row) => row.session_id));
  const onboardingLaunchSessions = new Set(firstWinLaunchRows.map((row) => row.session_id));
  const onboardingShownCount = onboardingShownSessions.size;
  const onboardingGoalCount = onboardingGoalSessions.size;
  const onboardingPlanCount = onboardingPlanSessions.size;
  const onboardingLaunchCount = onboardingLaunchSessions.size;
  const onboardingGoalConversion = onboardingShownCount > 0 ? onboardingGoalCount / onboardingShownCount : 0;
  const onboardingPlanConversion = onboardingShownCount > 0 ? onboardingPlanCount / onboardingShownCount : 0;
  const onboardingLaunchConversion = onboardingShownCount > 0 ? onboardingLaunchCount / onboardingShownCount : 0;
  const onboardingDropAfterShown = Math.max(0, onboardingShownCount - onboardingGoalCount);
  const onboardingDropAfterGoal = Math.max(0, onboardingGoalCount - onboardingPlanCount);
  const onboardingDropAfterPlan = Math.max(0, onboardingPlanCount - onboardingLaunchCount);

  const goalBreakdown = Array.from(
    firstWinGoalRows.reduce((acc, row) => {
      const goal = typeof row.payload?.goal === 'string' ? row.payload.goal : 'unknown';
      const entry = acc.get(goal) ?? { goal, sessions: new Set<string>() };
      entry.sessions.add(row.session_id);
      acc.set(goal, entry);
      return acc;
    }, new Map<string, { goal: string; sessions: Set<string> }>())
      .values()
  )
    .map((row) => ({
      goal: row.goal,
      sessions: row.sessions.size,
      share: onboardingGoalCount > 0 ? row.sessions.size / onboardingGoalCount : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  const launchPathBreakdown = Array.from(
    firstWinLaunchRows.reduce((acc, row) => {
      const targetPath = typeof row.payload?.targetPath === 'string' ? row.payload.targetPath : 'unknown';
      const entry = acc.get(targetPath) ?? { targetPath, sessions: new Set<string>() };
      entry.sessions.add(row.session_id);
      acc.set(targetPath, entry);
      return acc;
    }, new Map<string, { targetPath: string; sessions: Set<string> }>())
      .values()
  )
    .map((row) => ({
      targetPath: row.targetPath,
      sessions: row.sessions.size,
      share: onboardingLaunchCount > 0 ? row.sessions.size / onboardingLaunchCount : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  const frictionMetrics = buildFrictionMonitorMetrics(frictionSnapshots, { alertThreshold: 0.3, hotspotMinSamples: 3 });
  const aiReplaySummary = buildAIDecisionReplaySummary(aiDecisionRows, aiAuditRows, {
    recentLimit: 20,
    decisionType: aiType === 'all' ? null : aiType,
    decisionMode: aiMode === 'all' ? null : aiMode,
    source: aiSource === 'all' ? null : aiSource,
    reviewOutcome: aiOutcome === 'all' ? null : aiOutcome,
  });
  const aiAssistGroup = aiReplaySummary.groups.find(
    (group) => group.decisionType === 'triage_recommendation' && group.decisionMode === 'assist'
  );
  const aiAutoGroup = aiReplaySummary.groups.find(
    (group) => group.decisionType === 'triage_recommendation' && group.decisionMode === 'auto'
  );
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
  const autoTriageEligibleRows = triageQueueRows.filter((row) => {
    if (row.status === 'resolved') return false;
    if (!row.updatedAt) return true;
    const ageMinutes = (Date.now() - new Date(row.updatedAt).getTime()) / (1000 * 60);
    return Number.isFinite(ageMinutes) && ageMinutes >= AUTO_TRIAGE_MINUTES_COOLDOWN;
  });

  const dynamicTracks = Array.from(
    new Set([
      ...committedRows.map((row) => row.track_slug),
      ...frictionSnapshots.map((row) => row.trackSlug),
      ...firstWinShownRows.map((row) => row.track_slug),
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

  async function adjudicateAIDecision(formData: FormData) {
    'use server';

    const decisionId = formData.get('decisionId');
    const label = formData.get('label');
    const notes = formData.get('notes');
    if (typeof decisionId !== 'string' || typeof label !== 'string') return;
    await reviewAIDecisionAction({
      decisionId,
      label,
      notes: typeof notes === 'string' ? notes : null,
    });
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
            href={buildLink({ tab: 'quality', range, track, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
            className={`rounded-lg px-4 py-2 text-sm ${tab === 'quality' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Recommendation Quality
          </Link>
          <Link
            href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
            className={`rounded-lg px-4 py-2 text-sm ${tab === 'friction' ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Friction Monitor
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['1d', '7d', '14d', '30d'] as RangeKey[]).map((option) => (
            <Link
              key={option}
              href={buildLink({ tab, range: option, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
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
                aiType,
                aiMode,
                aiSource,
                aiOutcome,
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

            <section className="mt-8 rounded-xl border border-border-subtle bg-surface-interactive p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-text-primary">Onboarding First-Win Funnel</h2>
                <span className="text-xs text-text-muted">Telemetry track: onboarding</span>
              </div>

              <div className="mb-5 grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Shown</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">{onboardingShownCount}</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Goal Selected</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">
                    {onboardingGoalCount} <span className="text-sm text-text-secondary">({formatPercent(onboardingGoalConversion)})</span>
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Plan Generated</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">
                    {onboardingPlanCount} <span className="text-sm text-text-secondary">({formatPercent(onboardingPlanConversion)})</span>
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Launched</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">
                    {onboardingLaunchCount} <span className="text-sm text-text-secondary">({formatPercent(onboardingLaunchConversion)})</span>
                  </p>
                </div>
              </div>

              <div className="mb-6 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted">
                    <tr>
                      <th className="py-2">Stage</th>
                      <th className="py-2">Unique Sessions</th>
                      <th className="py-2">Conv. from Shown</th>
                      <th className="py-2">Drop-off from Previous</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">Shown</td>
                      <td className="py-2 text-text-primary">{onboardingShownCount}</td>
                      <td className="py-2 text-text-primary">100.0%</td>
                      <td className="py-2 text-text-secondary">-</td>
                    </tr>
                    <tr className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">Goal selected</td>
                      <td className="py-2 text-text-primary">{onboardingGoalCount}</td>
                      <td className="py-2 text-text-primary">{formatPercent(onboardingGoalConversion)}</td>
                      <td className="py-2 text-text-secondary">{onboardingDropAfterShown}</td>
                    </tr>
                    <tr className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">Plan generated</td>
                      <td className="py-2 text-text-primary">{onboardingPlanCount}</td>
                      <td className="py-2 text-text-primary">{formatPercent(onboardingPlanConversion)}</td>
                      <td className="py-2 text-text-secondary">{onboardingDropAfterGoal}</td>
                    </tr>
                    <tr className="border-t border-border-subtle">
                      <td className="py-2 text-text-secondary">Launched</td>
                      <td className="py-2 text-text-primary">{onboardingLaunchCount}</td>
                      <td className="py-2 text-text-primary">{formatPercent(onboardingLaunchConversion)}</td>
                      <td className="py-2 text-text-secondary">{onboardingDropAfterPlan}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-text-primary">Goal Selection Mix</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-text-muted">
                        <tr><th className="py-2">Goal</th><th className="py-2">Sessions</th><th className="py-2">Share</th></tr>
                      </thead>
                      <tbody>
                        {goalBreakdown.map((row) => (
                          <tr key={row.goal} className="border-t border-border-subtle">
                            <td className="py-2 text-text-secondary">{row.goal}</td>
                            <td className="py-2 text-text-primary">{row.sessions}</td>
                            <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                          </tr>
                        ))}
                        {goalBreakdown.length === 0 && (
                          <tr className="border-t border-border-subtle">
                            <td className="py-3 text-text-muted" colSpan={3}>No goal selection events in this window.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold text-text-primary">Launch Target Paths</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-text-muted">
                        <tr><th className="py-2">Path</th><th className="py-2">Sessions</th><th className="py-2">Share</th></tr>
                      </thead>
                      <tbody>
                        {launchPathBreakdown.map((row) => (
                          <tr key={row.targetPath} className="border-t border-border-subtle">
                            <td className="py-2 text-text-secondary">{row.targetPath}</td>
                            <td className="py-2 text-text-primary">{row.sessions}</td>
                            <td className="py-2 text-text-primary">{formatPercent(row.share)}</td>
                          </tr>
                        ))}
                        {launchPathBreakdown.length === 0 && (
                          <tr className="border-t border-border-subtle">
                            <td className="py-3 text-text-muted" colSpan={3}>No launch events in this window.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-text-primary">AI Decision Replay</h2>
                <div className="flex items-center gap-3 text-xs">
                  <Link
                    href={`/api/admin/session-intelligence/ai-replay?days=${RANGE_DAYS[range]}&decisionType=${aiType}&decisionMode=${aiMode}&source=${aiSource}&reviewOutcome=${aiOutcome}`}
                    className="text-cyan-300 hover:text-cyan-200"
                  >
                    Open JSON
                  </Link>
                  <Link
                    href={`/api/admin/session-intelligence/ai-replay?format=csv&days=${RANGE_DAYS[range]}&decisionType=${aiType}&decisionMode=${aiMode}&source=${aiSource}&reviewOutcome=${aiOutcome}`}
                    className="text-cyan-300 hover:text-cyan-200"
                  >
                    Open CSV
                  </Link>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {(['all', 'triage_brief', 'triage_recommendation'] as AIDecisionTypeKey[]).map((option) => (
                  <Link
                    key={`aiType:${option}`}
                    href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType: option, aiMode, aiSource, aiOutcome })}
                    className={`rounded-full border px-3 py-1 text-xs ${aiType === option ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                  >
                    type: {option}
                  </Link>
                ))}
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {(['all', 'assist', 'auto', 'suggest'] as AIDecisionModeKey[]).map((option) => (
                  <Link
                    key={`aiMode:${option}`}
                    href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode: option, aiSource, aiOutcome })}
                    className={`rounded-full border px-3 py-1 text-xs ${aiMode === option ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                  >
                    mode: {option}
                  </Link>
                ))}
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {(['all', 'session_intelligence', 'ai_recommendation', 'ai_auto_batch'] as AIDecisionSourceKey[]).map((option) => (
                  <Link
                    key={`aiSource:${option}`}
                    href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode, aiSource: option, aiOutcome })}
                    className={`rounded-full border px-3 py-1 text-xs ${aiSource === option ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                  >
                    source: {option}
                  </Link>
                ))}
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {(['all', 'confirmed', 'overridden', 'inconclusive', 'unreviewed'] as AIDecisionOutcomeKey[]).map((option) => (
                  <Link
                    key={`aiOutcome:${option}`}
                    href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome: option })}
                    className={`rounded-full border px-3 py-1 text-xs ${aiOutcome === option ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                  >
                    outcome: {option}
                  </Link>
                ))}
              </div>
              <div className="mb-4 grid gap-3 md:grid-cols-5">
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Decisions Logged ({range})</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">{aiReplaySummary.totalDecisions}</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Assist Override Rate</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">
                    {aiAssistGroup ? formatPercent(aiAssistGroup.overrideRate) : '0.0%'}
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Auto Override Rate</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">
                    {aiAutoGroup ? formatPercent(aiAutoGroup.overrideRate) : '0.0%'}
                  </p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Average Confidence</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">
                    {aiReplaySummary.confidence.average === null ? '-' : aiReplaySummary.confidence.average.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mb-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Confirmed</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-300">{formatPercent(aiReplaySummary.outcomes.confirmedRate)}</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Overridden</p>
                  <p className="mt-1 text-xl font-semibold text-amber-300">{formatPercent(aiReplaySummary.outcomes.overriddenRate)}</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Unreviewed</p>
                  <p className="mt-1 text-xl font-semibold text-blue-300">{formatPercent(aiReplaySummary.outcomes.unreviewedRate)}</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Inconclusive</p>
                  <p className="mt-1 text-xl font-semibold text-sky-300">{formatPercent(aiReplaySummary.outcomes.inconclusiveRate)}</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="text-xs uppercase tracking-wider text-text-muted">Review Latency (p50/p90 min)</p>
                  <p className="mt-1 text-xl font-semibold text-text-primary">
                    {aiReplaySummary.reviewLatency.p50Minutes === null || aiReplaySummary.reviewLatency.p90Minutes === null
                      ? '-'
                      : `${Math.round(aiReplaySummary.reviewLatency.p50Minutes)}/${Math.round(aiReplaySummary.reviewLatency.p90Minutes)}`}
                  </p>
                </div>
              </div>
              <p className="mb-4 text-xs text-text-muted">
                Confidence bins: high {aiReplaySummary.confidence.high}, medium {aiReplaySummary.confidence.medium}, low {aiReplaySummary.confidence.low}, unknown {aiReplaySummary.confidence.unknown}
              </p>
              {aiReplaySummary.insights.length > 0 && (
                <div className="mb-4 rounded-lg border border-border-subtle bg-surface p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-text-muted">Actionable Insights</p>
                  <ul className="space-y-2 text-sm">
                    {aiReplaySummary.insights.map((insight) => (
                      <li key={insight.id} className="text-text-secondary">
                        <span className={`mr-2 rounded-full px-2 py-0.5 text-xs ${insight.severity === 'critical' ? 'bg-red-900/40 text-red-300' : insight.severity === 'warning' ? 'bg-amber-900/40 text-amber-300' : 'bg-blue-900/40 text-blue-300'}`}>
                          {insight.severity}
                        </span>
                        <span className="text-text-primary">{insight.title}:</span> {insight.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted">
                    <tr>
                      <th className="py-2">Type</th>
                      <th className="py-2">Mode</th>
                      <th className="py-2">Total</th>
                      <th className="py-2">Overrides</th>
                      <th className="py-2">Override Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiReplaySummary.groups.map((group) => (
                      <tr key={`${group.decisionType}:${group.decisionMode}`} className="border-t border-border-subtle">
                        <td className="py-2 text-text-secondary">{group.decisionType}</td>
                        <td className="py-2 text-text-secondary">{group.decisionMode}</td>
                        <td className="py-2 text-text-primary">{group.total}</td>
                        <td className="py-2 text-text-secondary">{group.overrides}</td>
                        <td className="py-2 text-text-primary">{formatPercent(group.overrideRate)}</td>
                      </tr>
                    ))}
                    {aiReplaySummary.groups.length === 0 && (
                      <tr className="border-t border-border-subtle">
                        <td className="py-3 text-text-muted" colSpan={5}>No AI decisions in this window yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mb-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted">
                    <tr>
                      <th className="py-2">Source</th>
                      <th className="py-2">Total</th>
                      <th className="py-2">Overrides</th>
                      <th className="py-2">Override Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiReplaySummary.sources.map((row) => (
                      <tr key={row.source} className="border-t border-border-subtle">
                        <td className="py-2 text-text-secondary">{row.source}</td>
                        <td className="py-2 text-text-primary">{row.total}</td>
                        <td className="py-2 text-text-secondary">{row.overrides}</td>
                        <td className="py-2 text-text-primary">{formatPercent(row.overrideRate)}</td>
                      </tr>
                    ))}
                    {aiReplaySummary.sources.length === 0 && (
                      <tr className="border-t border-border-subtle">
                        <td className="py-3 text-text-muted" colSpan={4}>No source-level data in this window.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mb-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted">
                    <tr>
                      <th className="py-2">Hotspot</th>
                      <th className="py-2">Total</th>
                      <th className="py-2">Overrides</th>
                      <th className="py-2">Override Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiReplaySummary.hotspots.slice(0, 10).map((row) => (
                      <tr key={`${row.trackSlug}:${row.stepIndex}`} className="border-t border-border-subtle">
                        <td className="py-2 text-text-secondary">{`${row.trackSlug}:${row.stepIndex}`}</td>
                        <td className="py-2 text-text-primary">{row.total}</td>
                        <td className="py-2 text-text-secondary">{row.overrides}</td>
                        <td className="py-2 text-text-primary">{formatPercent(row.overrideRate)}</td>
                      </tr>
                    ))}
                    {aiReplaySummary.hotspots.length === 0 && (
                      <tr className="border-t border-border-subtle">
                        <td className="py-3 text-text-muted" colSpan={4}>No hotspot-level data in this window.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mb-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted">
                    <tr>
                      <th className="py-2">Confidence Bucket</th>
                      <th className="py-2">Total</th>
                      <th className="py-2">Overrides</th>
                      <th className="py-2">Override Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiReplaySummary.calibration.map((row) => (
                      <tr key={row.bucket} className="border-t border-border-subtle">
                        <td className="py-2 text-text-secondary">{row.bucket}</td>
                        <td className="py-2 text-text-primary">{row.total}</td>
                        <td className="py-2 text-text-secondary">{row.overrides}</td>
                        <td className="py-2 text-text-primary">{formatPercent(row.overrideRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-muted">
                    <tr>
                      <th className="py-2">Time</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Mode</th>
                      <th className="py-2">Hotspot</th>
                      <th className="py-2">Confidence</th>
                      <th className="py-2">Outcome</th>
                      <th className="py-2">First Review (min)</th>
                      <th className="py-2">Adjudicate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiReplaySummary.recent.map((row) => (
                      <tr key={`${row.createdAt}:${row.trackSlug}:${row.stepIndex}:${row.decisionType}`} className="border-t border-border-subtle">
                        <td className="py-2 text-text-secondary">{new Date(row.createdAt).toLocaleString()}</td>
                        <td className="py-2 text-text-secondary">{row.decisionType}</td>
                        <td className="py-2 text-text-secondary">{row.decisionMode}</td>
                        <td className="py-2 text-text-secondary">{`${row.trackSlug}:${row.stepIndex}`}</td>
                        <td className="py-2 text-text-primary">{row.confidence === null ? '-' : row.confidence.toFixed(2)}</td>
                        <td className={`py-2 font-medium ${row.reviewOutcome === 'overridden' ? 'text-amber-300' : row.reviewOutcome === 'confirmed' ? 'text-emerald-300' : row.reviewOutcome === 'inconclusive' ? 'text-sky-300' : 'text-blue-300'}`}>
                          {row.reviewOutcome}
                        </td>
                        <td className="py-2 text-text-secondary">{row.minutesToFirstManualUpdate === null ? '-' : row.minutesToFirstManualUpdate.toFixed(1)}</td>
                        <td className="py-2">
                          <form action={adjudicateAIDecision} className="flex flex-wrap items-center gap-1">
                            <input type="hidden" name="decisionId" value={row.id} />
                            <select
                              name="label"
                              defaultValue={row.reviewLabel ?? 'confirmed'}
                              className="rounded border border-border-subtle bg-surface px-2 py-1 text-xs text-text-primary"
                            >
                              <option value="confirmed">confirmed</option>
                              <option value="overridden">overridden</option>
                              <option value="inconclusive">inconclusive</option>
                            </select>
                            <input
                              name="notes"
                              defaultValue={row.reviewNotes ?? ''}
                              placeholder="optional note"
                              className="w-40 rounded border border-border-subtle bg-surface px-2 py-1 text-xs text-text-primary placeholder:text-text-muted"
                            />
                            <button
                              type="submit"
                              className="rounded border border-border-interactive px-2 py-1 text-xs text-text-primary hover:bg-surface"
                            >
                              Save
                            </button>
                          </form>
                          {(row.reviewedBy || row.reviewedAt) && (
                            <p className="mt-1 text-[11px] text-text-muted">
                              {row.reviewedBy || 'admin'} {row.reviewedAt ? `at ${new Date(row.reviewedAt).toLocaleString()}` : ''}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                    {aiReplaySummary.recent.length === 0 && (
                      <tr className="border-t border-border-subtle">
                        <td className="py-3 text-text-muted" colSpan={8}>No recent decisions to replay.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

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
                    autoTriageEligibleRows.slice(0, 5).map((row) => ({
                      trackSlug: row.trackSlug,
                      stepIndex: row.stepIndex,
                    }))
                  )}
                />
                <button
                  type="submit"
                  className="rounded-full border border-emerald-700/60 bg-emerald-950/30 px-4 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!autoTriageEnabled || autoTriageEligibleRows.length === 0}
                >
                  AI Auto-triage Top 5 Eligible
                </button>
                <span className="text-xs text-text-muted">
                  {autoTriageEnabled
                    ? `Eligible: ${autoTriageEligibleRows.length} (cooldown ${AUTO_TRIAGE_MINUTES_COOLDOWN}m)`
                    : 'Auto-triage disabled by feature flag'}
                </span>
              </form>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                {(['open', 'all', 'new', 'investigating', 'resolved'] as QueueStatusKey[]).map((status) => (
                  <Link
                    key={status}
                    href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus: status, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
                    className={`rounded-full border px-3 py-1 text-xs ${queueStatus === status ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                  >
                    {status}
                  </Link>
                ))}
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Link
                  href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner: 'all', aiType, aiMode, aiSource, aiOutcome })}
                  className={`rounded-full border px-3 py-1 text-xs ${queueOwner === 'all' ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                >
                  all owners
                </Link>
                <Link
                  href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner: 'unassigned', aiType, aiMode, aiSource, aiOutcome })}
                  className={`rounded-full border px-3 py-1 text-xs ${queueOwner === 'unassigned' ? 'border-border-interactive text-text-primary bg-surface' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface'}`}
                >
                  unassigned
                </Link>
                {queueOwnerOptions.map((owner) => (
                  <Link
                    key={owner}
                    href={buildLink({ tab: 'friction', range, track, focusTrack, focusStep, queueStatus, queueOwner: owner, aiType, aiMode, aiSource, aiOutcome })}
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
                              aiType,
                              aiMode,
                              aiSource,
                              aiOutcome,
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
                                aiType,
                                aiMode,
                                aiSource,
                                aiOutcome,
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
                    href={buildLink({ tab: 'friction', range, track, queueStatus, queueOwner, aiType, aiMode, aiSource, aiOutcome })}
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
