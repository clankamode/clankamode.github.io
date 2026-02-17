export const AI_POLICY_VERSION = 'policy_os_v1';
export const AI_POLICY_CONFIDENCE_THRESHOLD = 0.6;
export const AI_POLICY_TIMEOUT_MS = 4000;
export const AI_POLICY_PRIMARY_MODEL = 'gpt-5-mini';
export const AI_POLICY_FALLBACK_MODEL = 'gpt-5-nano';

export type AIPolicyErrorCode =
  | 'none'
  | 'provider_unavailable'
  | 'request_failed'
  | 'timeout'
  | 'empty_output'
  | 'parse_failed'
  | 'validation_failed'
  | 'low_confidence';

export interface SessionPlanDecisionOutput {
  selectedIds: string[];
  reasonSummary: string;
}

export interface ScopePolicyDecisionOutput {
  maxItems: number;
  maxMinutes: number;
  reasonSummary: string;
}

export interface OnboardingPathDecisionOutput {
  targetPath: string;
  trackSlug: 'dsa' | 'system-design' | 'job-hunt' | null;
  reasonSummary: string;
}

export interface FrictionTriageDecisionOutput {
  status: 'new' | 'investigating' | 'resolved';
  owner: string | null;
  rationale: string;
}

export interface PolicyDecisionEnvelope<T> {
  output: T;
  confidence: number;
  model: string;
  latencyMs: number;
  fallbackUsed: boolean;
  errorCode: AIPolicyErrorCode;
}
