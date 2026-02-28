import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { getUserLearningState } from '@/lib/user-learning-state';
import { applyPersonalizationScopeExperiment } from '@/lib/session-personalization-experiment';
import { buildSessionPersonalizationProfile } from '@/lib/session-personalization';
import { ONBOARDING_BIAS_MAX_COMMITTED_SESSIONS } from '@/lib/progress/constants';
import { getDayKeyUTC, getPillarName, normalizeSessionItemHref } from '@/lib/progress/helpers';
import { mapOnboardingGoalToTrackSlug, normalizeTrackSlug, isPracticeTrack } from '@/lib/progress/identity';
import { getOnboardingProfile, getCommittedSessionCount } from '@/lib/progress/onboarding';
import { getProgressSummaryWithLibrary } from '@/lib/progress/progress-summary';
import {
  buildPracticeSessionCandidatesFromRows,
  derivePracticePerformance,
  fetchPracticeRowSources,
} from '@/lib/progress/practice';
import { collectLearnCandidates } from '@/lib/progress/session-candidates';
import { planSessionItemsForState } from '@/lib/progress/session-planning';
import { buildLast7Proof, deriveSessionMode, resolveSessionTrack } from '@/lib/progress/session-proof';
import { applyScopePolicyToSession } from '@/lib/progress/session-scope';
import { getRecentlyItemHrefSets } from '@/lib/progress/telemetry';
import type {
  GetSessionStateOptions,
  SessionItem,
  SessionState,
} from '@/lib/progress/types';

export async function getSessionState(
  userId: string,
  preferredTrackSlug?: string,
  googleId?: string,
  options: GetSessionStateOptions = {}
): Promise<SessionState> {
  const normalizedPreferredTrack = normalizeTrackSlug(preferredTrackSlug);
  const [{ summary, library }, onboardingProfile, committedSessionCount] = await Promise.all([
    getProgressSummaryWithLibrary(userId, googleId),
    getOnboardingProfile(userId, googleId),
    getCommittedSessionCount(userId, googleId),
  ]);

  let onboardingBiasedTrackSlug: string | undefined;
  if (!normalizedPreferredTrack && onboardingProfile && committedSessionCount < ONBOARDING_BIAS_MAX_COMMITTED_SESSIONS) {
    onboardingBiasedTrackSlug = normalizeTrackSlug(onboardingProfile.first_launch_track_slug || undefined)
      || mapOnboardingGoalToTrackSlug(onboardingProfile.goal);
  }

  const effectivePreferredTrackSlug = normalizedPreferredTrack || onboardingBiasedTrackSlug;
  const preferredTrack = normalizedPreferredTrack
    ? library.find((pillar) => pillar.slug === normalizedPreferredTrack)
    : effectivePreferredTrackSlug
      ? library.find((pillar) => pillar.slug === effectivePreferredTrackSlug)
      : null;
  const resolvedTrackSlug = preferredTrack?.slug || effectivePreferredTrackSlug || 'dsa';

  const useGenerative = isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, options.viewer ?? null);
  const aiPolicySessionPlanEnabled = useGenerative && isFeatureEnabled(
    FeatureFlags.AI_POLICY_SESSION_PLAN,
    options.viewer ?? null
  );
  const aiPolicyScopeEnabled = useGenerative && isFeatureEnabled(
    FeatureFlags.AI_POLICY_SCOPE,
    options.viewer ?? null
  );
  const userState = useGenerative
    ? (await getUserLearningState(userId, resolvedTrackSlug, googleId)).userState
    : null;

  const completedIds = new Set(summary.completedIds);
  let articleCandidates: SessionItem[] = [];
  let sectionCandidates: SessionItem[] = [];

  if (preferredTrack) {
    const preferredCollection = collectLearnCandidates({
      pillars: [preferredTrack],
      completedIds,
      allowCompleted: false,
      useGenerative,
      userState,
      includeChunkItems: useGenerative,
    });
    articleCandidates = preferredCollection.fullItems;
    sectionCandidates = preferredCollection.chunkItems;

    if (articleCandidates.length === 0) {
      const fallbackCollection = collectLearnCandidates({
        pillars: [preferredTrack],
        completedIds,
        allowCompleted: true,
        useGenerative,
        userState,
        includeChunkItems: useGenerative,
      });
      articleCandidates = fallbackCollection.fullItems;
      sectionCandidates = fallbackCollection.chunkItems;
    }
  } else {
    const collection = collectLearnCandidates({
      pillars: library,
      completedIds,
      allowCompleted: false,
      useGenerative,
      userState,
      includeChunkItems: useGenerative,
    });
    articleCandidates = collection.fullItems;
    sectionCandidates = collection.chunkItems;
  }

  const plannerTrackSlug = preferredTrack?.slug || articleCandidates[0]?.pillarSlug || sectionCandidates[0]?.pillarSlug || resolvedTrackSlug;
  const plannerTrackName = preferredTrack?.name || getPillarName(plannerTrackSlug, library);
  const {
    finalized: recentlyFinalizedItemHrefs,
    completed: recentlyCompletedItemHrefs,
    committed: recentlyCommittedItemHrefs,
  } = useGenerative
    ? await getRecentlyItemHrefSets(userId, plannerTrackSlug, googleId)
    : { finalized: new Set<string>(), completed: new Set<string>(), committed: new Set<string>() };

  const recentExclusionHrefs = new Set<string>([
    ...Array.from(recentlyFinalizedItemHrefs),
    ...Array.from(recentlyCompletedItemHrefs),
    ...Array.from(recentlyCommittedItemHrefs),
  ]);

  if (recentExclusionHrefs.size > 0) {
    articleCandidates = articleCandidates.filter((item) => !recentExclusionHrefs.has(normalizeSessionItemHref(item.href)));
    sectionCandidates = sectionCandidates.filter((item) => !recentExclusionHrefs.has(normalizeSessionItemHref(item.href)));
  }

  const dayKey = getDayKeyUTC();
  let practiceCandidates: SessionItem[] = [];
  let practiceTargetDifficulty: 'Easy' | 'Medium' | 'Hard' | null = null;

  if (useGenerative && isPracticeTrack(plannerTrackSlug)) {
    const [practicePerformance, practiceRowSources] = await Promise.all([
      derivePracticePerformance(userId, googleId),
      fetchPracticeRowSources(),
    ]);
    practiceTargetDifficulty = practicePerformance.targetDifficulty;
    practiceCandidates = await buildPracticeSessionCandidatesFromRows(
      plannerTrackSlug,
      practicePerformance.targetDifficulty,
      practicePerformance.rationale,
      `${userId}:${plannerTrackSlug}:${dayKey}`,
      practiceRowSources,
      userState
    );
  }

  const filteredPracticeCandidates = recentExclusionHrefs.size > 0
    ? practiceCandidates.filter((item) => !recentExclusionHrefs.has(normalizeSessionItemHref(item.href)))
    : practiceCandidates;

  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const weeklyCompletions = summary.allCompletionDates.filter((value) => new Date(value).getTime() >= sevenDaysAgo).length;
  const completionRate = summary.totalArticles > 0 ? summary.completedArticles / summary.totalArticles : 0.6;
  const timeAdherence = Math.min(1, weeklyCompletions / 6);
  const nextDayReturnRate = summary.streakDays >= 2 ? 1 : summary.streakDays === 1 ? 0.6 : 0.2;

  const outcomeSignals = useGenerative ? {
    completionRate,
    timeAdherence,
    nextDayReturnRate,
    ritualQuality: userState?.lastInternalization
      ? (userState.lastInternalization.picked === 'learned' ? 0.9 : 0.65)
      : 0.45,
  } : undefined;

  const personalizationProfile = buildSessionPersonalizationProfile({
    selectedTrackSlug: plannerTrackSlug,
    onboardingGoal: onboardingProfile?.goal ?? null,
    onboardingTrackSlug: normalizeTrackSlug(onboardingProfile?.first_launch_track_slug || undefined) ?? null,
    onboardingBiasActive: Boolean(onboardingBiasedTrackSlug && !normalizedPreferredTrack),
    committedSessionCount,
    stubbornConceptCount: userState?.stubbornConcepts.length ?? 0,
    failureModeCount: userState?.failureModes.length ?? 0,
    outcomeSignals: outcomeSignals ?? {
      completionRate,
      timeAdherence,
      nextDayReturnRate,
      ritualQuality: userState?.lastInternalization ? 0.65 : 0.45,
    },
  });

  let sessionItems = articleCandidates.slice(0, 3);
  let planPolicyDecisionId: string | null = null;
  let scopePolicyDecisionId: string | null = null;
  let policyFallbackUsed = false;

  if (useGenerative) {
    const planningResult = await planSessionItemsForState({
      userId,
      googleId,
      dayKey,
      trackSlug: plannerTrackSlug,
      trackName: plannerTrackName,
      userState,
      completedIds,
      articleCandidates,
      sectionCandidates,
      practiceCandidates: filteredPracticeCandidates,
      recentExclusionHrefs,
      personalizationProfile,
      summaryRecentActivityTitles: summary.recentActivity.map((activity) => activity.title),
      outcomeSignals,
      aiPolicySessionPlanEnabled,
      practiceTargetDifficulty,
    });

    sessionItems = planningResult.sessionItems;
    planPolicyDecisionId = planningResult.planPolicyDecisionId;
    policyFallbackUsed = planningResult.policyFallbackUsed;
  }

  let personalizationExperiment = null;
  if (useGenerative && options.enablePersonalizationScopeExperiment && sessionItems.length > 0) {
    const baselineItems = sessionItems.slice(0, 3);
    const scopeResult = applyPersonalizationScopeExperiment({
      userId,
      items: baselineItems,
      profile: personalizationProfile,
    });
    sessionItems = scopeResult.items as SessionItem[];
    personalizationExperiment = scopeResult.experiment;
  }

  if (useGenerative && aiPolicyScopeEnabled && sessionItems.length > 0) {
    const scopeResult = await applyScopePolicyToSession({
      userId,
      trackSlug: plannerTrackSlug,
      onboardingGoal: onboardingProfile?.goal ?? null,
      profile: personalizationProfile,
      sessionItems,
      personalizationExperiment,
    });
    sessionItems = scopeResult.sessionItems;
    personalizationExperiment = scopeResult.personalizationExperiment;
    scopePolicyDecisionId = scopeResult.scopePolicyDecisionId;
    policyFallbackUsed = policyFallbackUsed || scopeResult.fallbackUsed;
  }

  const now = sessionItems[0] || null;
  const upNext = sessionItems.slice(1, 4);
  const mode = deriveSessionMode(now, summary.recentActivity[0]?.completedAt);
  const { last7, todayCount } = buildLast7Proof(summary.allCompletionDates);
  const track = resolveSessionTrack({
    now,
    preferredTrack,
    articleCandidates,
    library,
  });

  return {
    mode,
    now,
    upNext,
    proof: {
      streakDays: summary.streakDays,
      todayCount,
      last7,
    },
    track,
    personalization: personalizationProfile,
    personalizationExperiment,
    planPolicyDecisionId,
    scopePolicyDecisionId,
    policyFallbackUsed,
  };
}
