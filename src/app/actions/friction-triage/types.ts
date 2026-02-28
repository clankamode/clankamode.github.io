import type { FrictionState, FrictionTriagePayload, FrictionTriageStatus } from '@/types/friction';

export type { FrictionTriagePayload, FrictionTriageStatus, FrictionState };

export interface SnapshotEvidenceRow {
  created_at: string;
  session_id: string;
  friction_state: FrictionState;
  trigger: string;
  confidence: number | string;
  signals: Record<string, unknown> | null;
}

export interface TelemetryEvidenceRow {
  created_at: string;
  session_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
}

export interface RecommendationResponse {
  status?: string;
  owner?: string | null;
  rationale?: string;
};

export type TriageAuditAction = 'manual_update' | 'ai_brief' | 'ai_recommendation' | 'ai_auto_batch';

export interface ExistingTriageRow {
  status: string | null;
  owner: string | null;
  notes: string | null;
  updated_at?: string | null;
}

export interface OpenAIResponseContent {
  type?: string;
  text?: string;
}

export interface OpenAIResponseItem {
  type?: string;
  content?: OpenAIResponseContent[];
}

export interface OpenAIResponse {
  output_text?: string;
  output?: OpenAIResponseItem[];
}

export interface TriageTopEvent {
  eventType: string;
  count: number;
}

export interface TriageLatestSnapshot {
  createdAt: string;
  state: FrictionState;
  trigger: string;
  confidence: number;
}

export interface BriefEvidence {
  trackSlug: string;
  stepIndex: number;
  lookbackDays: number;
  sampleSize: number;
  uniqueSessions: number;
  stuckRate: number;
  averageConfidence: number;
  averageElapsedRatio: number;
  averagePracticeBlockedCount: number;
  averageChunkToggleCount: number;
  topEvents: TriageTopEvent[];
  latestSnapshots: TriageLatestSnapshot[];
}

export interface OwnerCandidateRow {
  owner: string | null;
  status: string;
}
