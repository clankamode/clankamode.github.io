'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getEffectiveIdentityFromSession } from '@/lib/auth-identity';
import { decideOnboardingPathPolicy } from '@/lib/ai-policy/runtime';
import { AI_POLICY_VERSION } from '@/lib/ai-policy/types';
import { buildAIDecisionDedupeKey, logAIDecision } from '@/lib/ai-decision-registry';
import { FeatureFlags, isFeatureEnabled } from '@/lib/flags';
import type { OnboardingGoal } from '@/types/onboarding';

const SAFE_PATH = /^\/[a-z0-9/_-]*$/i;

function isSafePath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (path.startsWith('/api/')) return false;
  return SAFE_PATH.test(path.split('?')[0].split('#')[0]);
}

function normalizePath(path: string): string {
  return path.split('?')[0].split('#')[0];
}

function resolveTrackSlugFromPath(path: string): 'dsa' | 'system-design' | 'job-hunt' | null {
  const [pathname, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');
  const queryTrack = params.get('track');
  if (queryTrack === 'dsa' || queryTrack === 'system-design' || queryTrack === 'job-hunt') {
    return queryTrack;
  }
  if (pathname.startsWith('/assessment')) return 'dsa';
  if (pathname.startsWith('/learn/system-design')) return 'system-design';
  if (pathname.startsWith('/learn/job-hunt')) return 'job-hunt';
  if (pathname.startsWith('/learn/dsa')) return 'dsa';
  return null;
}

function buildDeterministicOnboardingPath(input: {
  goal: OnboardingGoal;
  returnTo: string | null;
  sessionStartPath: string;
}) {
  if (input.returnTo && isSafePath(input.returnTo)) {
    const normalized = normalizePath(input.returnTo);
    return {
      targetPath: normalized,
      trackSlug: resolveTrackSlugFromPath(normalized),
      reasonSummary: 'Resume flow to preserve momentum.',
    };
  }

  // Session-first onboarding: always land in the home gate unless resuming.
  if (input.goal === 'work') {
    return {
      targetPath: '/home',
      trackSlug: 'system-design' as const,
      reasonSummary: 'Launch a guided session from your home gate.',
    };
  }

  if (input.goal === 'fundamentals') {
    return {
      targetPath: '/home',
      trackSlug: 'dsa' as const,
      reasonSummary: 'Start a fundamentals-focused session from home.',
    };
  }

  return {
    targetPath: '/home',
    trackSlug: 'dsa' as const,
    reasonSummary: 'Start with a focused interview-prep session from home.',
  };
}

export async function decideOnboardingPathAction(payload: {
  goal: OnboardingGoal;
  returnTo: string | null;
  sessionStartPath: string;
}) {
  const session = await getServerSession(authOptions);
  const identity = getEffectiveIdentityFromSession(session);
  if (!identity) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const fallback = buildDeterministicOnboardingPath(payload);
  const allowedPaths = ['/assessment', '/learn', '/home'];
  if (isSafePath(payload.returnTo)) {
    allowedPaths.push(normalizePath(payload.returnTo));
  }

  const policyEnabled = isFeatureEnabled(FeatureFlags.AI_POLICY_ONBOARDING, session?.user ?? null);
  if (!policyEnabled) {
    return {
      success: true as const,
      targetPath: fallback.targetPath,
      trackSlug: fallback.trackSlug,
      reasonSummary: fallback.reasonSummary,
      confidence: 0,
      fallbackUsed: true,
      decisionId: null,
      aiPolicyVersion: AI_POLICY_VERSION,
    };
  }

  const decision = await decideOnboardingPathPolicy({
    goal: payload.goal,
    returnTo: isSafePath(payload.returnTo) ? normalizePath(payload.returnTo) : null,
    sessionStartPath: payload.sessionStartPath,
    allowedPaths,
    fallbackOutput: fallback,
  });

  const targetPath = isSafePath(decision.output.targetPath)
    ? normalizePath(decision.output.targetPath)
    : fallback.targetPath;

  const writeResult = await logAIDecision({
    decisionType: 'onboarding_path',
    decisionMode: 'auto',
    trackSlug: decision.output.trackSlug ?? 'onboarding',
    stepIndex: null,
    actorEmail: identity.email,
    model: decision.model,
    promptVersion: 'ai_policy_os_v1',
    confidence: decision.confidence,
    rationale: decision.output.reasonSummary,
    inputJson: {
      goal: payload.goal,
      returnTo: isSafePath(payload.returnTo) ? normalizePath(payload.returnTo) : null,
      sessionStartPath: payload.sessionStartPath,
      allowedPaths,
    },
    outputJson: {
      targetPath,
      trackSlug: decision.output.trackSlug,
      reasonSummary: decision.output.reasonSummary,
    },
    applied: true,
    source: 'ai_policy',
    decisionScope: 'onboarding',
    decisionTarget: `welcome:${identity.email}`,
    fallbackUsed: decision.fallbackUsed,
    latencyMs: decision.latencyMs,
    errorCode: decision.errorCode === 'none' ? null : decision.errorCode,
    dedupeKey: buildAIDecisionDedupeKey({
      decisionType: 'onboarding_path',
      decisionMode: 'auto',
      decisionScope: 'onboarding',
      trackSlug: decision.output.trackSlug ?? 'onboarding',
      source: 'ai_policy',
      decisionTarget: `welcome:${identity.email}`,
    }),
  });

  return {
    success: true as const,
    targetPath,
    trackSlug: decision.output.trackSlug ?? resolveTrackSlugFromPath(targetPath),
    reasonSummary: decision.output.reasonSummary,
    confidence: decision.confidence,
    fallbackUsed: decision.fallbackUsed,
    decisionId: writeResult.id,
    aiPolicyVersion: AI_POLICY_VERSION,
  };
}
