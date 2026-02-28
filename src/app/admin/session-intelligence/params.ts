import type {
  AIDecisionModeKey,
  AIDecisionOutcomeKey,
  AIDecisionSourceKey,
  AIDecisionTypeKey,
  IntelligenceTab,
  QueueOwnerKey,
  QueueStatusKey,
  RangeKey,
  TrackKey,
} from './types';

export type {
  AIDecisionModeKey,
  AIDecisionOutcomeKey,
  AIDecisionSourceKey,
  AIDecisionTypeKey,
  IntelligenceTab,
  QueueOwnerKey,
  QueueStatusKey,
  RangeKey,
  TrackKey,
} from './types';
export const RANGE_DAYS: Record<RangeKey, number> = {
  '1d': 1,
  '7d': 7,
  '14d': 14,
  '30d': 30,
};

export const DEFAULT_TRACKS = ['all', 'dsa', 'job-hunt', 'system-design'] as const;
export const TRIAGE_STATUSES: ['new', 'investigating', 'resolved'] = ['new', 'investigating', 'resolved'];
export const AUTO_TRIAGE_MINUTES_COOLDOWN = 120;
export const MIN_DIRECTIONAL_SAMPLE_SIZE = 20;

export type ParsedSessionIntelligenceParams = {
  tab: IntelligenceTab;
  range: RangeKey;
  track: TrackKey;
  focusTrack: string | null;
  focusStep: number | null;
  queueStatus: QueueStatusKey;
  queueOwner: QueueOwnerKey;
  aiType: AIDecisionTypeKey;
  aiMode: AIDecisionModeKey;
  aiSource: AIDecisionSourceKey;
  aiOutcome: AIDecisionOutcomeKey;
};

export function parseTab(raw: string | string[] | undefined): IntelligenceTab {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'friction' ? 'friction' : 'quality';
}

export function parseRange(raw: string | string[] | undefined): RangeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === '1d' || value === '7d' || value === '14d' || value === '30d') {
    return value;
  }
  return '14d';
}

export function parseTrack(raw: string | string[] | undefined): TrackKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value === 'all') return 'all';
  if (!/^[a-z0-9-]+$/.test(value)) return 'all';
  return value;
}

export function parseFocusTrack(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  if (!/^[a-z0-9-]+$/.test(value)) return null;
  return value;
}

export function parseFocusStep(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) return null;
  return parsed;
}

export function parseTriageStatus(raw: FormDataEntryValue | null): 'new' | 'investigating' | 'resolved' {
  const value = typeof raw === 'string' ? raw : '';
  if (value === 'investigating' || value === 'resolved') {
    return value;
  }
  return 'new';
}

export function parseQueueStatus(raw: string | string[] | undefined): QueueStatusKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'all' || value === 'new' || value === 'investigating' || value === 'resolved') {
    return value;
  }
  return 'open';
}

export function parseQueueOwner(raw: string | string[] | undefined): QueueOwnerKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value === 'all') return 'all';
  if (value === 'unassigned') return 'unassigned';
  if (!/^[a-z0-9@._+\- ]+$/i.test(value)) return 'all';
  return value.toLowerCase();
}

export function parseAIDecisionType(raw: string | string[] | undefined): AIDecisionTypeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (
    value === 'triage_brief'
    || value === 'triage_recommendation'
    || value === 'session_plan'
    || value === 'scope_policy'
    || value === 'onboarding_path'
  ) {
    return value;
  }
  return 'all';
}

export function parseAIDecisionMode(raw: string | string[] | undefined): AIDecisionModeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'suggest' || value === 'assist' || value === 'auto') return value;
  return 'all';
}

export function parseAIDecisionSource(raw: string | string[] | undefined): AIDecisionSourceKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'session_intelligence' || value === 'ai_recommendation' || value === 'ai_auto_batch' || value === 'ai_policy') {
    return value;
  }
  return 'all';
}

export function parseAIDecisionOutcome(raw: string | string[] | undefined): AIDecisionOutcomeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'confirmed' || value === 'overridden' || value === 'inconclusive' || value === 'unreviewed') {
    return value;
  }
  return 'all';
}

export function parseLookbackDays(raw: FormDataEntryValue | null, fallback: RangeKey = '14d'): number {
  const value = typeof raw === 'string' ? Number(raw) : Number.NaN;
  const fallbackDays = RANGE_DAYS[fallback] ?? RANGE_DAYS['14d'];

  if (Number.isInteger(value) && value > 0 && value <= 30_000) {
    return value;
  }

  return Number.isInteger(fallbackDays) && fallbackDays > 0 ? fallbackDays : RANGE_DAYS['14d'];
}

export function parseSessionIntelligenceParams(
  raw: {
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
  },
): ParsedSessionIntelligenceParams {
  return {
    tab: parseTab(raw.tab),
    range: parseRange(raw.range),
    track: parseTrack(raw.track),
    focusTrack: parseFocusTrack(raw.focusTrack),
    focusStep: parseFocusStep(raw.focusStep),
    queueStatus: parseQueueStatus(raw.queueStatus),
    queueOwner: parseQueueOwner(raw.queueOwner),
    aiType: parseAIDecisionType(raw.aiType),
    aiMode: parseAIDecisionMode(raw.aiMode),
    aiSource: parseAIDecisionSource(raw.aiSource),
    aiOutcome: parseAIDecisionOutcome(raw.aiOutcome),
  };
}

export function buildLink(params: {
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

export function displayTrackLabel(track: TrackKey): string {
  if (track === 'all') return 'all';
  return track.replace(/-/g, ' ');
}
