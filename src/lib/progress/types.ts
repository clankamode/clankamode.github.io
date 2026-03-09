import type { LearningArticle, LearningPillar, LearningPillarWithTopics } from '@/types/content';
import type { UserLearningState } from '@/types/micro';
import type { OnboardingGoal } from '@/types/onboarding';

export interface OnboardingProfileRow {
  goal: OnboardingGoal;
  first_launch_track_slug: string | null;
  first_launch_path: string;
}

export interface SessionPlanLock {
  createdAt: number;
  itemHrefs: string[];
  items: SessionItem[];
}

export interface ArticleLookupEntry {
  article: LearningArticle;
  pillar: LearningPillar;
}

export interface RecentActivityItem {
  articleId: string;
  articleSlug: string;
  pillarSlug: string;
  title: string;
  completedAt: string;
}

export interface PillarProgress {
  id: string;
  slug: string;
  name: string;
  totalArticles: number;
  completedArticles: number;
  percent: number;
}

export interface NextArticle {
  articleId: string;
  articleSlug: string;
  pillarSlug: string;
  title: string;
  readingTimeMinutes: number | null;
}

export interface StreakDaySummaryState {
  date: string;
  state: 'earned' | 'freeze';
  reason?: 'manual-freeze' | 'weekend-off';
}

export interface ProgressSummary {
  totalArticles: number;
  completedArticles: number;
  percent: number;
  streakDays: number;
  streakDayStates: StreakDaySummaryState[];
  pillars: PillarProgress[];
  recentActivity: RecentActivityItem[];
  nextArticle: NextArticle | null;
  completedIds: string[];
  allCompletionDates: string[];
}

export interface ProgressSummaryWithLibrary {
  summary: ProgressSummary;
  library: LearningPillarWithTopics[];
}

export interface BookmarkItem {
  articleId: string;
  articleSlug: string;
  pillarSlug: string;
  title: string;
  excerpt: string | null;
  readingTimeMinutes: number | null;
  savedAt: string;
}

export type SessionMode = 'pick_track' | 'normal' | 'just_finished';

export interface SessionIntent {
  type: 'bridge' | 'tradeoff' | 'foundation' | 'practice';
  from?: string[];
  to?: string[];
  text: string;
}

export interface SessionItem {
  type: 'learn' | 'practice';
  title: string;
  subtitle: string;
  pillarSlug: string;
  href: string;
  articleId?: string;
  slug?: string;
  estMinutes: number | null;
  intent: SessionIntent;
  confidence?: number;
  primaryConceptSlug?: string | null;
  targetConcept?: string | null;
  sessionChunkIndex?: number;
  sessionChunkCount?: number;
  sessionChunkTitle?: string | null;
  sourceArticleTitle?: string | null;
  practiceQuestionId?: string;
  questionId?: string;
  questionName?: string;
  practiceQuestionUrl?: string;
  practiceDifficulty?: 'Easy' | 'Medium' | 'Hard';
  practiceQuestionDescription?: string;
  estimatedMinutes?: number;
}

export interface LearningDelta {
  introduced: string[];
  reinforced: string[];
  unlocked: string[];
}

export interface SessionProof {
  streakDays: number;
  todayCount: number;
  dailyGoal: {
    target: number;
    completed: number;
    remaining: number;
    met: boolean;
  };
  last7: { date: string; count: number }[];
}

export interface SessionState {
  mode: SessionMode;
  now: SessionItem | null;
  upNext: SessionItem[];
  proof: SessionProof;
  track: { slug: string; name: string } | null;
  personalization: SessionPersonalizationProfile | null;
  personalizationExperiment: PersonalizationScopeExperiment | null;
  planPolicyDecisionId?: string | null;
  scopePolicyDecisionId?: string | null;
  policyFallbackUsed?: boolean;
}

export interface GetSessionStateOptions {
  enablePersonalizationScopeExperiment?: boolean;
  viewer?: { role?: string } | null;
}

export interface PracticeQuestionRow {
  id: string;
  name: string;
  leetcode_number: number | null;
  leetcode_url: string | null;
  difficulty: string;
  prompt_full: string;
  source: string[];
  concept_slug: string | null;
  concept_tags: unknown;
}

export type PracticeDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface RankedPracticeQuestion {
  row: PracticeQuestionRow & { leetcode_number: number; leetcode_url: string };
  difficulty: PracticeDifficulty;
  matchedConceptSlug: string | null;
}

export interface PracticePerformance {
  recentScores: number[];
  targetDifficulty: PracticeDifficulty;
  rationale: string;
}

export interface PracticeRowSources {
  peraltaRows: PracticeQuestionRow[];
  fallbackRows: PracticeQuestionRow[];
}

export interface LearnCandidateCollection {
  fullItems: SessionItem[];
  chunkItems: SessionItem[];
}

export interface SessionPlanningResult {
  sessionItems: SessionItem[];
  planPolicyDecisionId: string | null;
  policyFallbackUsed: boolean;
}

import type {
  PersonalizationScopeExperiment,
} from '@/lib/session-personalization-experiment';
import type {
  SessionPersonalizationProfile,
} from '@/lib/session-personalization';

export interface SessionScopeResult {
  sessionItems: SessionItem[];
  personalizationExperiment: PersonalizationScopeExperiment | null;
  scopePolicyDecisionId: string | null;
  policyFallbackUsed: boolean;
}

export interface SessionGenerationInput {
  userId: string;
  googleId?: string;
  dayKey: string;
  trackSlug: string;
  trackName: string;
  userState: UserLearningState | null;
  completedIds: Set<string>;
  articleCandidates: SessionItem[];
  sectionCandidates: SessionItem[];
  practiceCandidates: SessionItem[];
  recentExclusionHrefs: Set<string>;
  personalizationProfile: SessionPersonalizationProfile;
  summaryRecentActivityTitles: string[];
  outcomeSignals?: {
    completionRate: number;
    timeAdherence: number;
    nextDayReturnRate: number;
    ritualQuality: number;
  };
  aiPolicySessionPlanEnabled: boolean;
  practiceTargetDifficulty: PracticeDifficulty | null;
}
