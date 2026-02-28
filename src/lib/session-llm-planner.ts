export type {
  CandidateConceptStat,
  PlannerOutcomeSignals,
  SessionPlannerCandidate,
  SessionPlannerInput,
} from '@/lib/session-llm-planner/types';

export {
  planSessionItemsWithLLM,
} from '@/lib/session-llm-planner/llm';

export {
  applySessionPlanPolicySelection,
} from '@/lib/session-llm-planner/validation';

export {
  buildHeuristicPlan,
  enforcePlanDiversity,
} from '@/lib/session-llm-planner/heuristic-plan';

export {
  daysSinceLastSeen,
  difficultyMultiplier,
  minDaysUntilReview,
  rankCandidatesHeuristically,
} from '@/lib/session-llm-planner/heuristic-ranking';

export {
  highestTitleSimilarity,
} from '@/lib/session-llm-planner/concepts';

export {
  buildPlannerPrompt,
} from '@/lib/session-llm-planner/prompt';

export type {
  PracticeQuestionSummary,
} from '@/lib/session-llm-planner/practice-step';

export {
  appendPracticeStepToPlan,
} from '@/lib/session-llm-planner/practice-step';
