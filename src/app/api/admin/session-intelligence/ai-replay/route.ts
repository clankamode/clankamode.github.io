import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { buildAIDecisionReplaySummary } from '@/lib/session-ai-replay';
import { UserRole, hasRole } from '@/types/roles';

type DecisionRow = {
  id: string;
  created_at: string;
  decision_type: string;
  decision_mode: string;
  track_slug: string;
  step_index: number | null;
  actor_email: string;
  confidence: number | null;
  source: string;
  output_json: Record<string, unknown> | null;
};

type AuditRow = {
  created_at: string;
  action_type: string;
  track_slug: string;
  step_index: number;
  after_status: string | null;
  after_owner: string | null;
};

function parseEnumParam(raw: string | null, allowed: string[]): string | null {
  if (!raw) return null;
  return allowed.includes(raw) ? raw : null;
}

function parseOutcomeParam(raw: string | null): 'confirmed' | 'overridden' | 'inconclusive' | 'unreviewed' | null {
  if (raw === 'confirmed' || raw === 'overridden' || raw === 'inconclusive' || raw === 'unreviewed') return raw;
  return null;
}

function toCsvValue(value: string | number | null | boolean): string {
  if (value === null) return '';
  const raw = String(value);
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);
  if (!token || !hasRole(effectiveRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const daysParam = Number(req.nextUrl.searchParams.get('days') ?? '14');
  const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 90 ? Math.floor(daysParam) : 14;
  const decisionType = parseEnumParam(
    req.nextUrl.searchParams.get('decisionType'),
    ['triage_brief', 'triage_recommendation', 'session_plan', 'scope_policy', 'onboarding_path']
  );
  const decisionMode = parseEnumParam(req.nextUrl.searchParams.get('decisionMode'), ['suggest', 'assist', 'auto']);
  const reviewOutcome = parseOutcomeParam(req.nextUrl.searchParams.get('reviewOutcome'));
  const format = req.nextUrl.searchParams.get('format');
  const source = req.nextUrl.searchParams.get('source');
  const sourceFilter = source && source !== 'all' && source.length <= 80 ? source : null;
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const admin = getSupabaseAdminClient();
  const [{ data: decisionsData, error: decisionsError }, { data: auditsData, error: auditsError }] = await Promise.all([
    admin
      .from('SessionAIDecisions')
      .select('id, created_at, decision_type, decision_mode, track_slug, step_index, actor_email, confidence, source, output_json')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(1000),
    admin
      .from('SessionFrictionTriageAudit')
      .select('created_at, action_type, track_slug, step_index, after_status, after_owner')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(5000),
  ]);

  if (decisionsError || auditsError) {
    return NextResponse.json(
      {
        error: 'Failed to load replay source rows',
        details: {
          decisions: decisionsError?.message ?? null,
          audits: auditsError?.message ?? null,
        },
      },
      { status: 500 }
    );
  }

  const decisions = (decisionsData || []) as DecisionRow[];
  const audits = (auditsData || []) as AuditRow[];
  const replay = buildAIDecisionReplaySummary(decisions, audits, {
    recentLimit: 30,
    decisionType,
    decisionMode,
    source: sourceFilter,
    reviewOutcome,
  });

  if (format === 'csv') {
    const header = [
      'createdAt',
      'id',
      'decisionType',
      'decisionMode',
      'trackSlug',
      'stepIndex',
      'actorEmail',
      'confidence',
      'source',
      'reviewOutcome',
      'reviewLabel',
      'overriddenWithin24h',
      'minutesToFirstManualUpdate',
    ].join(',');
    const rows = replay.recent.map((row) => ([
      row.createdAt,
      row.id,
      row.decisionType,
      row.decisionMode,
      row.trackSlug,
      row.stepIndex,
      row.actorEmail,
      row.confidence,
      row.source,
      row.reviewOutcome,
      row.reviewLabel,
      row.overriddenWithin24h,
      row.minutesToFirstManualUpdate,
    ].map(toCsvValue).join(',')));
    const csv = [header, ...rows].join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'inline; filename=\"session-ai-replay.csv\"',
      },
    });
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    lookbackDays: days,
    filters: {
      decisionType,
      decisionMode,
      source: sourceFilter,
      reviewOutcome,
    },
    totalDecisions: replay.totalDecisions,
    groups: replay.groups,
    sources: replay.sources,
    hotspots: replay.hotspots,
    confidence: replay.confidence,
    outcomes: replay.outcomes,
    reviewLatency: replay.reviewLatency,
    calibration: replay.calibration,
    insights: replay.insights,
    recent: replay.recent,
  });
}
