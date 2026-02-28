import type { SessionIntent, SessionItem } from '@/lib/progress';
import type { UserLearningState } from '@/types/micro';
import type { SessionPersonalizationProfile } from '@/lib/session-personalization';

export interface SessionPlannerCandidate {
  id: string;
  item: SessionItem;
}

export interface CandidateConceptStat {
  conceptSlug: string;
  exposures: number;
  lastSeenAt: string | null;
  mediumCompletions?: number;
}

export interface SessionPlannerInput {
  cacheKey?: string;
  budgetKey?: string;
  trackSlug: string;
  trackName: string;
  userState: UserLearningState | null;
  personalizationProfile?: SessionPersonalizationProfile | null;
  recentActivityTitles: string[];
  outcomeSignals?: PlannerOutcomeSignals;
  practiceTargetDifficulty?: 'Easy' | 'Medium' | 'Hard' | null;
  requirePracticeItem?: boolean;
  candidates: SessionPlannerCandidate[];
  maxItems?: number;
  conceptStats?: CandidateConceptStat[];
}

export interface PlannerOutcomeSignals {
  completionRate: number;
  timeAdherence: number;
  nextDayReturnRate: number;
  ritualQuality: number;
}

export interface SessionPlannerSelection {
  id: string;
  intentType?: SessionIntent['type'];
  intentText?: string;
  targetConcept?: string;
}

export interface SessionPlannerResponse {
  selected: SessionPlannerSelection[];
}

export interface RankerResponse {
  rankedIds: string[];
}

export const VALID_INTENT_TYPES = new Set<SessionIntent['type']>([
  'foundation',
  'bridge',
  'tradeoff',
  'practice',
]);

export interface CompactCandidate {
  id: string;
  type: string;
  scope: string;
  title: string;
  subtitle: string | null;
  estMinutes: number;
  confidence: number;
  targetConcept: string | null;
  concepts: string[];
  articleId: string | null;
  sectionId: number | null;
  intentType: string;
  intentText: string;
  href: string;
  description: string | null;
}

export interface PromptInput {
  trackName: string;
  trackSlug: string;
  maxItems: number;
  requirePracticeItem: boolean;
  hasPracticeCandidate: boolean;
  recentActivityTitles: string[];
  userState: UserLearningState | null;
  personalizationProfile?: SessionPersonalizationProfile | null;
  outcomeSignals?: PlannerOutcomeSignals;
  practiceTargetDifficulty: string | null;
  compactCandidates: CompactCandidate[];
}
