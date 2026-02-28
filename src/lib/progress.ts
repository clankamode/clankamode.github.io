export type {
  BookmarkItem,
  GetSessionStateOptions,
  LearningDelta,
  NextArticle,
  PillarProgress,
  PracticeDifficulty,
  PracticePerformance,
  PracticeQuestionRow,
  ProgressSummary,
  RankedPracticeQuestion,
  RecentActivityItem,
  SessionIntent,
  SessionItem,
  SessionMode,
  SessionProof,
  SessionState,
} from '@/lib/progress/types';

export {
  buildPracticePriorityConcepts,
  selectPracticeRowsForSession,
} from '@/lib/progress/practice';

export {
  getArticleCompletionStatus,
  getBookmarkStatus,
  getProgressSummary,
  getUserBookmarks,
} from '@/lib/progress/progress-summary';

export {
  normalizeSessionItemHref,
  resolvePrimaryConceptSlug,
} from '@/lib/progress/helpers';

export { getSessionState } from '@/lib/progress/session-state';
