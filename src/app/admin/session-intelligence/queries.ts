import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import type {
  TelemetryRow,
  SnapshotRow,
  FrictionDrilldownSnapshot,
  FetchedFrictionTriageRow,
  FetchedFrictionTriageAuditRow,
  AIDecisionRow,
  AIDecisionAuditRow,
  TrackKey,
  FrictionSnapshotInput,
} from './types';

export async function fetchTelemetryRows(eventType: string, sinceIso: string, track: TrackKey): Promise<TelemetryRow[]> {
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

export async function fetchFrictionSnapshots(sinceIso: string, track: TrackKey): Promise<FrictionSnapshotInput[]> {
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

export async function fetchFrictionDrilldown(
  sinceIso: string,
  trackSlug: string,
  stepIndex: number,
): Promise<{ snapshots: FrictionDrilldownSnapshot[]; telemetry: TelemetryTelemetryRow[] }> {
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

  return {
    snapshots,
    telemetry: (telemetryRows || []) as TelemetryTelemetryRow[],
  };
}

type TelemetryTelemetryRow = {
  created_at: string;
  event_type: string;
  session_id: string;
  payload: Record<string, unknown> | null;
};

export async function fetchFrictionTriageRows(track: TrackKey): Promise<FetchedFrictionTriageRow[]> {
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
  return data as FetchedFrictionTriageRow[];
}

export async function fetchFrictionTriageAuditRows(
  trackSlug: string,
  stepIndex: number,
): Promise<FetchedFrictionTriageAuditRow[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('SessionFrictionTriageAudit')
    .select('created_at, action_type, actor_email, before_status, before_owner, before_notes, after_status, after_owner, after_notes, rationale, metadata')
    .eq('track_slug', trackSlug)
    .eq('step_index', stepIndex)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !data) return [];
  return data as FetchedFrictionTriageAuditRow[];
}

export async function fetchAIDecisionRows(sinceIso: string, track: TrackKey): Promise<AIDecisionRow[]> {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from('SessionAIDecisions')
    .select('id, created_at, decision_type, decision_scope, decision_mode, track_slug, step_index, session_id, actor_email, confidence, fallback_used, latency_ms, error_code, source, output_json')
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

export async function fetchAIDecisionAuditRows(sinceIso: string, track: TrackKey): Promise<AIDecisionAuditRow[]> {
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
