import { buildAIDecisionDedupeKey, logAIDecision } from '@/lib/ai-decision-registry';
import { decideScopePolicy } from '@/lib/ai-policy/runtime';
import { POLICY_PROMPT_VERSION } from '@/lib/progress/constants';
import { sumSessionItemMinutes, trimSessionItemsByScope } from '@/lib/progress/helpers';
import type { PersonalizationScopeExperiment } from '@/lib/session-personalization-experiment';
import type { SessionPersonalizationProfile } from '@/lib/session-personalization';
import type { OnboardingGoal } from '@/types/onboarding';
import type { SessionItem } from '@/lib/progress/types';

export async function applyScopePolicyToSession(params: {
  userId: string;
  trackSlug: string;
  onboardingGoal: OnboardingGoal | null;
  profile: SessionPersonalizationProfile;
  sessionItems: SessionItem[];
  personalizationExperiment: PersonalizationScopeExperiment | null;
}): Promise<{
  sessionItems: SessionItem[];
  personalizationExperiment: PersonalizationScopeExperiment | null;
  scopePolicyDecisionId: string | null;
  fallbackUsed: boolean;
}> {
  const {
    userId,
    trackSlug,
    onboardingGoal,
    profile,
    sessionItems,
    personalizationExperiment,
  } = params;

  if (sessionItems.length === 0) {
    return {
      sessionItems,
      personalizationExperiment,
      scopePolicyDecisionId: null,
      fallbackUsed: false,
    };
  }

  const baselineItems = sessionItems.slice(0, 3);
  const fallbackScope = {
    maxItems: personalizationExperiment?.maxItems ?? 3,
    maxMinutes: personalizationExperiment?.maxMinutes ?? 22,
    reasonSummary: 'Deterministic scope fallback.',
  };

  const scopePolicy = await decideScopePolicy({
    trackSlug,
    goal: onboardingGoal,
    profileSegment: profile.segment,
    baselineItemCount: baselineItems.length,
    baselineMinutes: sumSessionItemMinutes(baselineItems),
    candidateMinutes: baselineItems.map((item) => item.estMinutes ?? 5),
    fallbackOutput: fallbackScope,
  });

  const trimmedItems = trimSessionItemsByScope(baselineItems, {
    maxItems: scopePolicy.output.maxItems,
    maxMinutes: scopePolicy.output.maxMinutes,
  });

  let experiment = personalizationExperiment;
  if (experiment) {
    experiment = {
      ...experiment,
      maxItems: scopePolicy.output.maxItems,
      maxMinutes: scopePolicy.output.maxMinutes,
      finalItemCount: trimmedItems.length,
      finalMinutes: sumSessionItemMinutes(trimmedItems),
    };
  }

  const scopeDecision = await logAIDecision({
    decisionType: 'scope_policy',
    decisionMode: 'auto',
    trackSlug,
    stepIndex: null,
    actorEmail: userId,
    model: scopePolicy.model,
    promptVersion: POLICY_PROMPT_VERSION,
    confidence: scopePolicy.confidence,
    rationale: scopePolicy.output.reasonSummary,
    inputJson: {
      baselineItemCount: baselineItems.length,
      baselineMinutes: sumSessionItemMinutes(baselineItems),
      profileSegment: profile.segment,
      onboardingGoal,
    },
    outputJson: {
      maxItems: scopePolicy.output.maxItems,
      maxMinutes: scopePolicy.output.maxMinutes,
      finalItemCount: trimmedItems.length,
      finalMinutes: sumSessionItemMinutes(trimmedItems),
    },
    applied: true,
    source: 'ai_policy',
    decisionScope: 'scope',
    decisionTarget: `home_gate:${userId}`,
    fallbackUsed: scopePolicy.fallbackUsed,
    latencyMs: scopePolicy.latencyMs,
    errorCode: scopePolicy.errorCode === 'none' ? null : scopePolicy.errorCode,
    dedupeKey: buildAIDecisionDedupeKey({
      decisionType: 'scope_policy',
      decisionMode: 'auto',
      decisionScope: 'scope',
      trackSlug,
      stepIndex: null,
      source: 'ai_policy',
      decisionTarget: `home_gate:${userId}`,
    }),
  });

  return {
    sessionItems: trimmedItems,
    personalizationExperiment: experiment,
    scopePolicyDecisionId: scopeDecision.id,
    fallbackUsed: scopePolicy.fallbackUsed,
  };
}
