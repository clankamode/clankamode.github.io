import type { FrictionState, FrictionTriageStatus, FrictionTrigger } from '@/types/friction';
import type { FrictionMonitorMetrics } from '@/lib/friction-monitor';
import type { AIDecisionReplaySummary, AIDecisionReplayGroupRow } from '@/lib/session-ai-replay';
import type { PersonalizationInsights } from '@/lib/session-personalization';
import type { SessionOperatorAction } from '@/lib/session-operator-actions';
import type { TransferScoreResult } from '@/lib/transfer-score';

export type { FrictionTriageStatus } from '@/types/friction';
export type { FrictionSnapshotInput } from '@/lib/friction-monitor';

export type TelemetryRow = {
  email: string;
  google_id: string | null;
  track_slug: string;
  session_id: string;
  created_at: string;
  payload: Record<string, unknown> | null;
};

export type SnapshotRow = {
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

export type FrictionDrilldownSnapshot = {
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

export type DrilldownTelemetryRow = {
  created_at: string;
  event_type: string;
  session_id: string;
  payload: Record<string, unknown> | null;
};

export type FetchedFrictionTriageRow = {
  track_slug: string;
  step_index: number;
  status: FrictionTriageStatus;
  owner: string | null;
  notes: string | null;
  updated_at: string;
  updated_by_email: string;
};

export type FetchedFrictionTriageAuditRow = {
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

export type AIDecisionRow = {
  id: string;
  created_at: string;
  decision_type: string;
  decision_scope: string | null;
  decision_mode: string;
  track_slug: string;
  step_index: number | null;
  session_id: string | null;
  actor_email: string;
  confidence: number | null;
  fallback_used: boolean;
  latency_ms: number | null;
  error_code: string | null;
  source: string;
  output_json: Record<string, unknown> | null;
};

export type AIDecisionAuditRow = {
  created_at: string;
  action_type: string;
  track_slug: string;
  step_index: number;
  after_status: string | null;
  after_owner: string | null;
};

export type IntelligenceTab = 'quality' | 'friction';
export type RangeKey = '1d' | '7d' | '14d' | '30d';
export type TrackKey = 'all' | string;
export type QueueStatusKey = 'open' | 'all' | FrictionTriageStatus;
export type QueueOwnerKey = 'all' | 'unassigned' | string;
export type AIDecisionTypeKey = 'all' | 'triage_brief' | 'triage_recommendation' | 'session_plan' | 'scope_policy' | 'onboarding_path';
export type AIDecisionModeKey = 'all' | 'suggest' | 'assist' | 'auto';
export type AIDecisionSourceKey = 'all' | 'session_intelligence' | 'ai_recommendation' | 'ai_auto_batch' | 'ai_policy';
export type AIDecisionOutcomeKey = 'all' | 'confirmed' | 'overridden' | 'inconclusive' | 'unreviewed';

export type ScopeCohort = 'control' | 'treatment' | 'not_eligible' | 'unknown';

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

export type OnboardingFunnelRow = {
  goal: string;
  sessions: number;
  share: number;
};

export type LaunchPathRow = {
  targetPath: string;
  sessions: number;
  share: number;
};

export type CohortFunnelRow = {
  cohort: ScopeCohort;
  committedCount: number;
  finalizedCount: number;
  finalizedRate: number;
};

export type CohortTransferRow = {
  cohort: 'control' | 'treatment';
  committedCount: number;
  transfer: TransferScoreResult;
};

export type PolicyLatencyRow = {
  scope: string;
  p95LatencyMs: number | null;
  count: number;
};

export type TriageWithStatusRow = {
  trackSlug: string;
  stepIndex: number;
  total: number;
  stuckCount: number;
  stuckRate: number;
  stateDistribution?: FrictionMonitorMetrics['stateDistribution'];
  status: FrictionTriageStatus;
  owner: string | null;
  notes: string | null;
  updatedAt: string | null;
  updatedByEmail: string | null;
  riskScore: number;
};

export type QualityRowSet = {
  committedRowsCount: number;
  committedSessionCount: number;
  lowSampleSize: boolean;
  repeatAnalysis: ReturnType<typeof import('@/lib/session-recommendation-quality').buildRepeatAnalysis>;
  funnel: ReturnType<typeof import('@/lib/session-recommendation-quality').buildFunnelByFirstItem>;
  repeatedItems: ReturnType<typeof import('@/lib/session-recommendation-quality').buildRepeatAnalysis>['itemRepeats'];
  goalBreakdown: OnboardingFunnelRow[];
  launchPathBreakdown: LaunchPathRow[];
  onboardingShownCount: number;
  onboardingGoalCount: number;
  onboardingPlanCount: number;
  onboardingLaunchCount: number;
  onboardingGoalConversion: number;
  onboardingPlanConversion: number;
  onboardingLaunchConversion: number;
  onboardingDropAfterShown: number;
  onboardingDropAfterGoal: number;
  onboardingDropAfterPlan: number;
  personalizationInsights: PersonalizationInsights;
  personalizationCoverage: number;
  transferScoreV0: TransferScoreResult;
  cohortFunnelRows: CohortFunnelRow[];
  cohortTransferRows: CohortTransferRow[];
  finalizeRateDelta: number | null;
  transferScoreDelta: number | null;
  committedWithKnownCohort: number;
  missingCohortAttributionRate: number;
  eligibleCommittedRowsCount: number;
  eligibleButUnassignedRate: number;
  eligibleAssignedRowsCount: number;
  treatmentShare: number;
  assignedEligibleTotal: number;
  sampleRatioMismatch: boolean;
  policyDecisionCount: number;
  policyCoverageCount: number;
  policyCoverageRate: number;
  policyFallbackCount: number;
  policyFallbackRate: number;
  policyParseFailureCount: number;
  policyParseFailureRate: number;
  policyLatencyByScope: PolicyLatencyRow[];
  operatorActions: SessionOperatorAction[];
  committedEventsCount: number;
};

export type FrictionRowSet = {
  frictionMetrics: FrictionMonitorMetrics;
  hotspotsWithTriage: TriageWithStatusRow[];
  triageQueueRows: TriageWithStatusRow[];
  autoTriageEligibleRows: TriageWithStatusRow[];
  queueOwnerOptions: string[];
  triageByHotspot: Map<string, FetchedFrictionTriageRow>;
  aiReplaySummary: AIDecisionReplaySummary;
  aiAssistGroup: AIDecisionReplayGroupRow | undefined;
  aiAutoGroup: AIDecisionReplayGroupRow | undefined;
  focusedTriage: FetchedFrictionTriageRow | null;
  frictionDrilldown: {
    snapshots: FrictionDrilldownSnapshot[];
    telemetry: DrilldownTelemetryRow[];
  } | null;
  frictionTriageAuditRows: FetchedFrictionTriageAuditRow[];
  focusTrack: string | null;
  focusStep: number | null;
};

export type SessionIntelligenceLoadResult = {
  range: RangeKey;
  track: TrackKey;
  trackOptions: string[];
  focusTrack: string | null;
  focusStep: number | null;
  tab: IntelligenceTab;
  queueStatus: QueueStatusKey;
  queueOwner: QueueOwnerKey;
  aiType: AIDecisionTypeKey;
  aiMode: AIDecisionModeKey;
  aiSource: AIDecisionSourceKey;
  aiOutcome: AIDecisionOutcomeKey;
  sinceIso: string;
  quality: QualityRowSet;
  friction: FrictionRowSet;
};
