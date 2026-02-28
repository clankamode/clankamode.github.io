import type { LearningDelta, SessionItem } from '@/lib/progress';
import type { SessionPersonalizationProfile } from '@/lib/session-personalization';
import type { PersonalizationScopeExperiment } from '@/lib/session-personalization-experiment';
import type { MicroSessionProposal } from '@/lib/session-micro';

export type SessionPhase = 'idle' | 'entry' | 'execution' | 'exit' | 'generating';
export type SessionTransitionStatus = 'ready' | 'advancing' | 'finalizing';

export const SESSION_STATE_STORAGE_KEY = 'session:state:v1';
export const LAST_MICRO_CONCEPT_STORAGE_KEY = 'session:last-micro-concept:v1';
export const PRACTICE_BLOCKED_EVENT_NAME = 'session:practice-blocked';

export interface SessionScope {
  track: { slug: string; name: string };
  items: SessionItem[];
  estimatedMinutes: number;
  exitCondition: string;
  userId?: string;
  googleId?: string;
  sessionId?: string;
  personalization?: SessionPersonalizationProfile | null;
  personalizationExperiment?: PersonalizationScopeExperiment | null;
  aiPolicyVersion?: string | null;
  planPolicyDecisionId?: string | null;
  scopePolicyDecisionId?: string | null;
  onboardingDecisionId?: string | null;
  policyFallbackUsed?: boolean;
}

export interface SessionExecutionState {
  sessionId: string;
  currentIndex: number;
  completedItems: string[];
  startedAt: Date;
  currentChunk: number;
  totalChunks: number;
  transitionStatus: SessionTransitionStatus;
}

export interface SessionExitState {
  completedCount: number;
  durationMinutes: number;
  nextRecommendation: SessionItem | null;
  delta: LearningDelta;
  rawDelta?: LearningDelta;
  primaryConcept: string | null;
  microSessionProposal: MicroSessionProposal | null;
}

export interface SessionState {
  phase: SessionPhase;
  scope: SessionScope | null;
  execution: SessionExecutionState | null;
  exit: SessionExitState | null;
  transitionStatus: SessionTransitionStatus;
}

export interface SessionContextValue {
  state: SessionState;
  isInSession: boolean;
  commitSession: (scope: SessionScope) => void;
  advanceItem: () => void;
  completeSession: () => void;
  abandonSession: () => void;
  resetToEntry: () => void;
  nextChunk: () => void;
  prevChunk: () => void;
  setTotalChunks: (total: number) => void;
  setGenerating: () => void;
  recordDrawerToggle: () => void;
}

export const initialState: SessionState = {
  phase: 'idle',
  scope: null,
  execution: null,
  exit: null,
  transitionStatus: 'ready',
};
