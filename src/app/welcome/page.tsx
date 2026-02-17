'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { FeatureFlags, isFeatureEnabled } from '@/lib/flags';
import { logTelemetryEvent } from '@/lib/telemetry';
import { upsertOnboardingProfileAction } from '@/app/actions/onboarding-profile';
import { decideOnboardingPathAction } from '@/app/actions/onboarding-path';
import type { OnboardingGoal } from '@/types/onboarding';

function sanitizeReturnTo(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/welcome')) return null;
  if (value.startsWith('/api/')) return null;
  return value;
}

function prettyPathLabel(path: string): string {
  const normalized =
    path
      .split('?')[0]
      .replace(/^\//, '')
      .replace(/-/g, ' ')
      .replace(/\//g, ' > ') || 'home';

  return normalized
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

function resolveTrackSlugFromPath(path: string): string | null {
  const [pathname, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');
  const queryTrack = params.get('track');
  const normalizedQueryTrack = queryTrack?.toLowerCase().trim();

  if (normalizedQueryTrack === 'system-design' || normalizedQueryTrack === 'job-hunt' || normalizedQueryTrack === 'dsa') {
    return normalizedQueryTrack;
  }

  if (pathname.startsWith('/assessment')) return 'dsa';
  if (pathname.startsWith('/learn/system-design')) return 'system-design';
  if (pathname.startsWith('/learn/job-hunt')) return 'job-hunt';
  if (pathname.startsWith('/learn/dsa')) return 'dsa';
  if (pathname.startsWith('/home')) return null;
  return null;
}

type Goal = OnboardingGoal;

type Plan = {
  label: string;
  duration: string;
  path: string;
  firstMove: string;
  artifact: string;
  nextSteps: string[];
  cta: string;
};

const GOAL_OPTIONS: Record<Goal, { label: string; helper: string; blurb: string }> = {
  interview: {
    label: 'Interview mastery',
    helper: 'Simulate real interview pressure',
    blurb: 'One timed rep plus immediate feedback.',
  },
  work: {
    label: 'Career acceleration',
    helper: 'Improve execution and communication',
    blurb: 'One guided session with practical application.',
  },
  fundamentals: {
    label: 'Fundamentals reset',
    helper: 'Rebuild core confidence quickly',
    blurb: 'One high-signal lesson to restore baseline.',
  },
};

function buildPlan(params: {
  goal: Goal;
  returnTo: string | null;
  sessionStartPath: string;
}): Plan {
  const { goal, returnTo } = params;

  if (returnTo) {
    return {
      label: `Continue to ${prettyPathLabel(returnTo)}`,
      duration: 'Under 1 minute',
      path: returnTo,
      firstMove: `Re-open ${prettyPathLabel(returnTo)} and continue where you paused.`,
      artifact: 'Momentum preserved without setup overhead.',
      nextSteps: ['Re-open saved destination', 'Finish current task', 'Get next recommendation'],
      cta: 'Continue where I left off',
    };
  }

  if (goal === 'interview') {
    return {
      label: 'First interview rep',
      duration: '8-10 minutes',
      path: '/home',
      firstMove: 'Start a focused interview-prep session with a clear first step.',
      artifact: 'Baseline interview readiness with your next drill queued.',
      nextSteps: ['Complete one timed problem', 'Review feedback', 'Start next rep'],
      cta: 'Start my first interview rep',
    };
  }

  if (goal === 'work') {
    const path = '/home';
    return {
      label: 'Guided work-focused session',
      duration: '10 minutes',
      path,
      firstMove: 'Run one guided session on practical reasoning and implementation clarity.',
      artifact: 'Personalized next three actions for job-relevant growth.',
      nextSteps: ['Complete one guided lesson', 'Capture one takeaway', 'Open next 3 actions'],
      cta: 'Start my guided session',
    };
  }

  return {
    label: 'Fundamentals reset session',
    duration: '6-8 minutes',
    path: '/home',
    firstMove: 'Start with a high-signal fundamentals lesson and rebuild confidence quickly.',
    artifact: 'Structured fundamentals baseline and concept sequence.',
    nextSteps: ['Finish one lesson', 'Validate understanding', 'Open next concept'],
    cta: 'Start my fundamentals reset',
  };
}

const STAGES = [
  { id: 1, label: 'Intent' },
  { id: 2, label: 'Plan' },
  { id: 3, label: 'Launch' },
] as const;

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();

  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [goal, setGoal] = useState<Goal>('interview');
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [onboardingDecision, setOnboardingDecision] = useState<{
    targetPath: string;
    trackSlug: 'dsa' | 'system-design' | 'job-hunt' | null;
    reasonSummary: string;
    decisionId: string | null;
    fallbackUsed: boolean;
    aiPolicyVersion: string;
  } | null>(null);
  const onboardingViewIdRef = useRef(`welcome_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);

  const showProgress = isFeatureEnabled(FeatureFlags.PROGRESS_TRACKING, session?.user ?? null);
  const showSessionMode = isFeatureEnabled(FeatureFlags.SESSION_MODE, session?.user ?? null);
  const sessionStartPath = showProgress && showSessionMode ? '/home' : '/learn';
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'));
  const displayName = session?.user?.name?.trim() || 'there';
  const isPreview = process.env.NODE_ENV !== 'production' && searchParams.get('preview') === '1';

  const plan = useMemo(
    () =>
      buildPlan({
        goal,
        returnTo,
        sessionStartPath,
      }),
    [goal, returnTo, sessionStartPath]
  );

  const hasResumeConfidence = Boolean(returnTo);
  const telemetrySessionId = onboardingViewIdRef.current;
  const recommendedPlanPath = onboardingDecision?.targetPath ?? plan.path;

  useEffect(() => {
    if (!session?.user?.email) return;
    logTelemetryEvent({
      userId: session.user.email,
      trackSlug: 'onboarding',
      sessionId: telemetrySessionId,
      eventType: 'first_win_run_shown',
      mode: 'gate',
      payload: {
        hasResumeConfidence,
        hasReturnTo: Boolean(returnTo),
        preview: isPreview,
      },
      dedupeKey: `${telemetrySessionId}:shown`,
    });
  }, [session?.user?.email, telemetrySessionId, hasResumeConfidence, returnTo, isPreview]);

  useEffect(() => {
    if (!session?.user?.email || hasResumeConfidence || stage !== 1) return;
    logTelemetryEvent({
      userId: session.user.email,
      trackSlug: 'onboarding',
      sessionId: telemetrySessionId,
      eventType: 'first_win_goal_selected',
      mode: 'gate',
      payload: {
        goal,
      },
      dedupeKey: `${telemetrySessionId}:goal:${goal}`,
    });
  }, [session?.user?.email, telemetrySessionId, hasResumeConfidence, stage, goal]);

  useEffect(() => {
    if (!session?.user?.email || hasResumeConfidence || stage !== 2) return;
    logTelemetryEvent({
      userId: session.user.email,
      trackSlug: 'onboarding',
      sessionId: telemetrySessionId,
      eventType: 'first_win_plan_generated',
      mode: 'gate',
      payload: {
        goal,
        planLabel: plan.label,
        planPath: recommendedPlanPath,
        duration: plan.duration,
        onboardingDecisionId: onboardingDecision?.decisionId ?? null,
        policyFallbackUsed: onboardingDecision?.fallbackUsed ?? false,
        aiPolicyVersion: onboardingDecision?.aiPolicyVersion ?? null,
      },
      dedupeKey: `${telemetrySessionId}:plan:${goal}`,
    });
  }, [
    session?.user?.email,
    telemetrySessionId,
    hasResumeConfidence,
    stage,
    goal,
    plan.label,
    recommendedPlanPath,
    plan.duration,
    onboardingDecision?.decisionId,
    onboardingDecision?.fallbackUsed,
    onboardingDecision?.aiPolicyVersion,
  ]);

  const handleGeneratePlan = async () => {
    if (isGeneratingPlan || hasResumeConfidence) {
      setStage(2);
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const result = await decideOnboardingPathAction({
        goal,
        returnTo,
        sessionStartPath,
      });

      if (result.success) {
        setOnboardingDecision({
          targetPath: result.targetPath,
          trackSlug: result.trackSlug,
          reasonSummary: result.reasonSummary,
          decisionId: result.decisionId,
          fallbackUsed: result.fallbackUsed,
          aiPolicyVersion: result.aiPolicyVersion,
        });
      } else {
        setOnboardingDecision(null);
      }
    } catch {
      setOnboardingDecision(null);
    } finally {
      setIsGeneratingPlan(false);
      setStage(2);
    }
  };

  const handleStart = async (targetPath: string) => {
    if (pendingPath) return;
    setPendingPath(targetPath);
    try {
      const isPolicyPrimaryPath = targetPath === recommendedPlanPath;
      const launchTrackSlug = isPolicyPrimaryPath
        ? onboardingDecision?.trackSlug ?? resolveTrackSlugFromPath(targetPath)
        : resolveTrackSlugFromPath(targetPath);

      await upsertOnboardingProfileAction({
        goal,
        firstLaunchPath: targetPath,
        firstLaunchTrackSlug: launchTrackSlug,
      });

      if (session?.user?.email) {
        logTelemetryEvent({
          userId: session.user.email,
          trackSlug: 'onboarding',
          sessionId: telemetrySessionId,
          eventType: 'first_win_launched',
          mode: 'gate',
          payload: {
            goal,
            stage,
            targetPath,
            hasResumeConfidence,
            usedAlternatives: showAlternatives && targetPath !== recommendedPlanPath,
            onboardingDecisionId: onboardingDecision?.decisionId ?? null,
            policyFallbackUsed: onboardingDecision?.fallbackUsed ?? false,
            aiPolicyVersion: onboardingDecision?.aiPolicyVersion ?? null,
          },
          dedupeKey: `${telemetrySessionId}:launch:${targetPath}`,
        });
      }

      window.sessionStorage.setItem(
        'onboarding:policy-context:v1',
        JSON.stringify({
          decisionId: onboardingDecision?.decisionId ?? null,
          fallbackUsed: onboardingDecision?.fallbackUsed ?? false,
          aiPolicyVersion: onboardingDecision?.aiPolicyVersion ?? null,
        })
      );

      await update({ completeFirstLogin: true });
      router.push(targetPath);
      router.refresh();
    } catch (error) {
      console.error('Failed to complete first-login state:', error);
      setPendingPath(null);
    }
  };

  const isBusy = pendingPath !== null;
  const isPrimaryPending = pendingPath === recommendedPlanPath;

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface-ambient px-4 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-brand-green/8 blur-3xl" />
      </div>

      <section className="relative mx-auto w-full max-w-4xl rounded-3xl border border-border-subtle bg-surface-workbench/92 p-6 shadow-2xl backdrop-blur-sm sm:p-9">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">First Win Run</p>
          {isPreview && <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">Preview</p>}
        </div>

        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.025em] sm:text-6xl sm:leading-[0.96]">
          {hasResumeConfidence ? 'Resume your flow in under a minute.' : `Get your first result in 8 minutes, ${displayName}.`}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
          {hasResumeConfidence
            ? 'We already know where you left off. Continue instantly and keep momentum.'
            : 'Give us one input. We generate your first focused plan and launch you right away.'}
        </p>

        {!hasResumeConfidence && (
          <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-border-subtle bg-surface p-1.5">
            {STAGES.map((step) => {
              const active = stage === step.id;
              const complete = stage > step.id;
              return (
                <div
                  key={step.id}
                  className={`rounded-xl px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? 'bg-surface-workbench text-text-primary shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                      : complete
                        ? 'bg-surface-interactive text-text-secondary'
                        : 'text-text-muted'
                  }`}
                >
                  <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border-subtle text-[10px]">
                    {step.id}
                  </span>
                  {step.label}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-border-interactive/55 bg-surface-workbench p-5 sm:p-6">
          {hasResumeConfidence && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">High-confidence start</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.01em] text-text-primary">{plan.label}</h2>
              <p className="mt-2 text-sm text-text-secondary">{plan.firstMove}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button variant="primary" size="lg" onClick={() => handleStart(recommendedPlanPath)} disabled={isBusy}>
                  {isPrimaryPending ? 'Preparing...' : plan.cta}
                </Button>
                <p className="text-sm text-text-secondary">Estimated time: {plan.duration}</p>
              </div>
            </>
          )}

          {!hasResumeConfidence && stage === 1 && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Step 1 of 3</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.01em] text-text-primary">Pick your near-term outcome</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(Object.keys(GOAL_OPTIONS) as Goal[]).map((goalKey) => {
                  const option = GOAL_OPTIONS[goalKey];
                  const selected = goal === goalKey;
                  return (
                    <button
                      key={goalKey}
                      type="button"
                      onClick={() => {
                        setGoal(goalKey);
                        setOnboardingDecision(null);
                      }}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                        selected
                          ? 'border-primary/55 bg-surface shadow-[0_0_0_1px_rgba(44,187,93,0.35),0_0_32px_-14px_rgba(44,187,93,0.78)]'
                          : 'border-border-subtle bg-surface-workbench hover:border-border-interactive hover:shadow-[0_10px_28px_-18px_rgba(0,0,0,0.75)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold text-text-primary">{option.label}</p>
                        {selected && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/65 bg-primary/12 text-xs font-semibold text-primary">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-text-secondary">{option.helper}</p>
                      <p className="mt-3 text-sm text-text-secondary">{option.blurb}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="primary" size="md" onClick={handleGeneratePlan} disabled={isGeneratingPlan}>
                  {isGeneratingPlan ? 'Generating plan...' : 'Generate my first plan'}
                </Button>
                <button
                  type="button"
                  className="text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
                  onClick={() => setShowAlternatives((v) => !v)}
                >
                  Not for me
                </button>
              </div>
            </>
          )}

          {!hasResumeConfidence && stage === 2 && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Step 2 of 3</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.01em] text-text-primary">Your first-win plan</h2>
              <p className="mt-2 text-lg font-medium text-text-primary">{plan.label}</p>
              <p className="mt-1 text-sm text-text-secondary">{plan.firstMove}</p>
              {onboardingDecision?.reasonSummary && (
                <p className="mt-2 text-xs text-text-muted">Policy note: {onboardingDecision.reasonSummary}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {plan.nextSteps.map((nextStep) => (
                  <span key={nextStep} className="rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs text-text-secondary">
                    {nextStep}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button variant="primary" size="md" onClick={() => setStage(3)}>
                  Lock this plan
                </Button>
                <button
                  type="button"
                  className="text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
                  onClick={() => {
                    setOnboardingDecision(null);
                    setStage(1);
                  }}
                >
                  Change goal
                </button>
              </div>
            </>
          )}

          {!hasResumeConfidence && stage === 3 && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Step 3 of 3</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.01em] text-text-primary">Launch your first win</h2>
              <p className="mt-2 text-sm text-text-secondary">{plan.artifact}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button variant="primary" size="lg" onClick={() => handleStart(recommendedPlanPath)} disabled={isBusy}>
                  {isPrimaryPending ? 'Preparing...' : plan.cta}
                </Button>
                <p className="text-sm text-text-secondary">Estimated time: {plan.duration}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-border-subtle/75 bg-surface/65 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Alternate starts</p>
            <button
              type="button"
              className="text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
              onClick={() => setShowAlternatives((v) => !v)}
            >
              {showAlternatives ? 'Hide options' : 'Show options'}
            </button>
          </div>

          {showAlternatives && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleStart('/learn')}
                disabled={isBusy}
                className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-left transition-colors hover:border-border-interactive hover:bg-surface-workbench disabled:opacity-60"
              >
                <p className="text-sm font-semibold text-text-primary">Browse lessons</p>
                <p className="mt-1 text-xs text-text-secondary">Explore topics and pick your own sequence.</p>
              </button>
              <button
                type="button"
                onClick={() => handleStart('/assessment')}
                disabled={isBusy}
                className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-left transition-colors hover:border-border-interactive hover:bg-surface-workbench disabled:opacity-60"
              >
                <p className="text-sm font-semibold text-text-primary">Practice coding problems</p>
                <p className="mt-1 text-xs text-text-secondary">Jump directly into interview-style reps.</p>
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
