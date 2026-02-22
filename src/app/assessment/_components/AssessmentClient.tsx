'use client';

import { useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { logTelemetryEvent } from '@/lib/telemetry';
import { ArrowRight, Code2, Terminal, Zap } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { EXECUTION_SURFACE_LAYOUT_CLASS } from '@/components/session/ExecutionSurface';
import SessionHUD from '@/components/session/SessionHUD';

type ButtonVariant = 'novice' | 'intermediate' | 'advanced';

const levels: Array<{
  id: string;
  title: string;
  difficulty: string;
  description: string;
  questionInfo: string;
  icon: React.ReactNode;
  variant: ButtonVariant;
}> = [
    {
      id: 'noob',
      title: 'Noob',
      difficulty: 'Easy',
      description: '2 easy questions to warm up and build confidence.',
      questionInfo: '2 easy questions',
      icon: <Zap className="h-5 w-5 text-brand-green" />,
      variant: 'novice' as const,
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      difficulty: 'Medium',
      description: '1 easy + 1 medium to keep you sharp.',
      questionInfo: '1 easy + 1 medium',
      icon: <Code2 className="h-5 w-5 text-orange-400" />,
      variant: 'intermediate' as const,
    },
    {
      id: 'faang',
      title: 'FAANG-level',
      difficulty: 'Hard',
      description: '2 medium or a medium + hard for the real deal.',
      questionInfo: '2 medium / 1 medium + 1 hard',
      icon: <Terminal className="h-5 w-5 text-red-500" />,
      variant: 'advanced' as const,
    },
  ];

interface AssessmentQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string | null;
}

interface AssessmentClientProps {
  forcedQuestionId?: string;
}

function getPracticeRunKey(sessionQuestionId: string): string {
  return `session:practice:ran:${sessionQuestionId}`;
}

function getPracticeOpenedKey(sessionQuestionId: string): string {
  return `session:practice:opened:${sessionQuestionId}`;
}

function buildPracticeWorkspaceHref(
  questionId: string,
  options?: { returnTo?: string; source?: 'session' | 'assessment'; sessionQuestionId?: string }
): string {
  const params = new URLSearchParams();
  params.set('source', options?.source || 'assessment');
  if (options?.returnTo) {
    params.set('returnTo', options.returnTo);
  }
  if (options?.sessionQuestionId) {
    params.set('sessionQuestionId', options.sessionQuestionId);
  }
  return `/code-editor/practice/${encodeURIComponent(questionId)}?${params.toString()}`;
}


export default function AssessmentClient({ forcedQuestionId }: AssessmentClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { state: sessionState, advanceItem } = useSessionContext();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionQuestion, setSessionQuestion] = useState<AssessmentQuestion | null>(null);
  const [sessionQuestionError, setSessionQuestionError] = useState<string | null>(null);
  const [loadingSessionQuestion, setLoadingSessionQuestion] = useState(false);
  const [workspaceRunDetected, setWorkspaceRunDetected] = useState(false);
  const [workspaceOpenedDetected, setWorkspaceOpenedDetected] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isOpeningWorkspace, setIsOpeningWorkspace] = useState(false);
  const skipLockRef = useRef(false);
  const workspaceOpenLockRef = useRef(false);

  const sessionQuestionId = forcedQuestionId || searchParams.get('questionId');
  const isInExecution = sessionState.phase === 'execution';
  const currentSessionItem = useMemo(() => {
    if (sessionState.phase !== 'execution' || !sessionState.scope || !sessionState.execution) {
      return null;
    }

    return sessionState.scope.items[sessionState.execution.currentIndex] || null;
  }, [sessionState]);
  const isSessionPracticeItem = Boolean(
    isInExecution &&
    currentSessionItem?.type === 'practice' &&
    (currentSessionItem.href.startsWith('/session/practice') || currentSessionItem.href.startsWith('/assessment'))
  );

  const selectedLevelData = levels.find((level) => level.id === selectedLevel);
  const selectedLevelLabel = selectedLevelData?.title ?? 'Assessment';
  const sessionQuestionStorageKeys = useMemo(() => {
    const keys = new Set<string>();
    if (sessionQuestionId) {
      keys.add(sessionQuestionId);
    }
    if (sessionQuestion?.id) {
      keys.add(sessionQuestion.id);
    }
    return Array.from(keys);
  }, [sessionQuestion?.id, sessionQuestionId]);
  useEffect(() => {
    const loadSessionQuestion = async () => {
      if (!sessionQuestionId) {
        setSessionQuestion(null);
        setSessionQuestionError(null);
        return;
      }

      if (status !== 'authenticated') {
        return;
      }

      setLoadingSessionQuestion(true);
      setSessionQuestionError(null);

      try {
        const response = await fetch(`/api/assessment/questions?questionId=${encodeURIComponent(sessionQuestionId)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load session question');
        }

        setSessionQuestion(data.question || null);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Failed to load session question';
        setSessionQuestionError(message);
      } finally {
        setLoadingSessionQuestion(false);
      }
    };

    loadSessionQuestion();
  }, [sessionQuestionId, status]);

  useEffect(() => {
    if (sessionQuestionStorageKeys.length === 0) {
      setWorkspaceRunDetected(false);
      setWorkspaceOpenedDetected(false);
      return;
    }

    const readPracticeState = () => {
      const hasRun = sessionQuestionStorageKeys.some((key) => window.sessionStorage.getItem(getPracticeRunKey(key)) === '1');
      const hasOpened = sessionQuestionStorageKeys.some((key) => window.sessionStorage.getItem(getPracticeOpenedKey(key)) === '1');
      setWorkspaceRunDetected(hasRun);
      setWorkspaceOpenedDetected(hasOpened);
    };

    readPracticeState();
    window.addEventListener('focus', readPracticeState);
    return () => window.removeEventListener('focus', readPracticeState);
  }, [sessionQuestionStorageKeys]);

  const handleSkipAssessment = useCallback(() => {
    if (!isInExecution || !sessionState.execution || !sessionState.scope) return;
    if (sessionState.transitionStatus !== 'ready' || sessionState.execution.transitionStatus !== 'ready') return;
    if (skipLockRef.current) return;
    skipLockRef.current = true;
    setIsSkipping(true);

    const questionIdentifier = sessionQuestion?.id || sessionQuestionId;

    logTelemetryEvent({
      userId: sessionState.scope.userId,
      trackSlug: sessionState.scope.track.slug,
      sessionId: sessionState.execution.sessionId || sessionState.scope.sessionId || 'unknown',
      eventType: 'item_completed',
      mode: 'execute',
      payload: {
        questionId: questionIdentifier,
        index: sessionState.execution.currentIndex,
        skipped: true,
      },
      dedupeKey: `practice_skipped_${sessionState.scope.sessionId}_${questionIdentifier || 'unknown_question'}`,
    });

    const nextItem = sessionState.scope.items[sessionState.execution.currentIndex + 1] ?? null;
    if (nextItem) {
      router.prefetch(nextItem.href);
    }

    advanceItem();
    if (nextItem) {
      router.push(nextItem.href);
    } else {
      router.replace('/home');
    }
  }, [isInExecution, sessionState, sessionQuestion?.id, sessionQuestionId, advanceItem, router]);

  const hasPracticeSignal = workspaceRunDetected || workspaceOpenedDetected;

  const trackSlug = sessionState.scope?.track.slug || 'dsa';
  const telemetrySessionId = sessionState.execution?.sessionId || sessionState.scope?.sessionId || 'session_practice';

  const openWorkspace = useCallback((question: AssessmentQuestion, source: 'session' | 'assessment') => {
    if (workspaceOpenLockRef.current) return;

    workspaceOpenLockRef.current = true;
    setIsOpeningWorkspace(true);

    const openedKeys = new Set<string>([question.id]);
    if (sessionQuestionId) {
      openedKeys.add(sessionQuestionId);
    }
    openedKeys.forEach((key) => {
      window.sessionStorage.setItem(getPracticeOpenedKey(key), '1');
    });
    setWorkspaceOpenedDetected(true);

    logTelemetryEvent({
      userId: sessionState.scope?.userId,
      trackSlug,
      sessionId: telemetrySessionId,
      eventType: 'coding_workspace_opened',
      mode: 'execute',
      payload: {
        questionId: question.id,
        source,
      },
      dedupeKey: `coding_workspace_opened_${telemetrySessionId}_${question.id}`,
    });

    router.push(buildPracticeWorkspaceHref(
      question.id,
      {
        source,
        returnTo: source === 'session'
          ? `/session/practice/${question.id}`
          : `/assessment?questionId=${encodeURIComponent(question.id)}`,
        sessionQuestionId: source === 'session' ? (sessionQuestionId || question.id) : question.id,
      }
    ));

    window.setTimeout(() => {
      workspaceOpenLockRef.current = false;
      setIsOpeningWorkspace(false);
    }, 1500);
  }, [router, sessionQuestionId, sessionState.scope?.userId, telemetrySessionId, trackSlug]);

  const handleStart = async (levelId: string) => {
    if (status !== 'authenticated') {
      await signIn('google', { callbackUrl: '/assessment' });
      return;
    }

    setSelectedLevel(levelId);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/interview-questions/random?level=${levelId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Failed to load questions');
      }

      const data = await response.json();
      const questions = data.questions || [];

      if (questions.length < 2) {
        throw new Error('Not enough questions available');
      }

      router.push(`/code-editor/mock?q1=${questions[0].id}&q2=${questions[1].id}`);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load questions';
      setError(message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setQuestions([]);
    setSelectedLevel(null);
    setError(null);
  };

  if (isSessionPracticeItem) {
    return (
      <div className="min-h-screen bg-background text-text-primary">
        <SessionHUD
          showViewToggle={false}
          secondaryStatusLabel="Practice chamber"
        />

        <main className="pt-16 pb-20">
          <div className={EXECUTION_SURFACE_LAYOUT_CLASS}>
            <div className="max-w-md mx-auto w-full pt-12 space-y-8">
              {loadingSessionQuestion ? (
                <div className="animate-pulse space-y-4 py-8">
                  <div className="h-6 w-3/4 rounded bg-border-subtle" />
                  <div className="h-4 w-1/2 rounded bg-border-subtle" />
                </div>
              ) : sessionQuestionError ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                  <p className="text-sm text-red-400">{sessionQuestionError}</p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => router.refresh()}
                      className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
                    >
                      Retry
                    </button>
                    <button
                      onClick={handleSkipAssessment}
                      disabled={isSkipping}
                      className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-60"
                    >
                      {isSkipping ? 'Skipping...' : 'Skip for now'}
                    </button>
                  </div>
                </div>
              ) : sessionQuestion ? (
                <>
                  <div className="rounded-2xl border border-border-subtle bg-surface-interactive p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary">
                      {sessionQuestion.title}
                    </h2>
                    <Badge variant="outline" className={cn(
                      "bg-transparent",
                      sessionQuestion.difficulty === 'Easy' ? "border-brand-green text-brand-green" :
                        sessionQuestion.difficulty === 'Medium' ? "border-brand-amber text-brand-amber" :
                          "border-red-500 text-red-500"
                    )}>
                      {sessionQuestion.difficulty}
                    </Badge>

                    <div className="flex items-center justify-between border-t border-border-subtle pt-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-1.5 w-1.5 rounded-full", workspaceOpenedDetected ? "bg-emerald-600" : "bg-border-subtle")} />
                        <span className="text-xs text-text-secondary">Opened</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-1.5 w-1.5 rounded-full", workspaceRunDetected ? "bg-emerald-600" : "bg-border-subtle")} />
                        <span className="text-xs text-text-secondary">Tests run</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-500 outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                    onClick={() => openWorkspace(sessionQuestion, 'session')}
                    disabled={isOpeningWorkspace}
                  >
                    {isOpeningWorkspace ? 'Opening workspace...' : hasPracticeSignal ? 'Resume workspace' : 'Enter workspace'}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {(currentSessionItem?.intent?.text || currentSessionItem?.estMinutes) && (
                    <div className="rounded-xl border border-border-subtle bg-surface-workbench p-4 space-y-2">
                      {currentSessionItem?.intent?.text && (
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {currentSessionItem.intent.text}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-text-muted">
                        {currentSessionItem?.estMinutes && (
                          <span>~{currentSessionItem.estMinutes} min</span>
                        )}
                        {sessionState.scope?.items[sessionState.execution ? sessionState.execution.currentIndex + 1 : -1]?.title && (
                          <>
                            <span>·</span>
                            <span>Then: {sessionState.scope.items[sessionState.execution!.currentIndex + 1].title}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={handleSkipAssessment}
                      disabled={isSkipping}
                      className="text-xs text-text-secondary hover:text-text-primary transition-colors py-2"
                    >
                      {isSkipping ? 'Skipping...' : 'Skip (no progress saved)'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border-subtle bg-surface-interactive p-6 text-center">
                  <p className="text-text-secondary">Question data not found.</p>
                  <button
                    onClick={handleSkipAssessment}
                    disabled={isSkipping}
                    className="mt-4 text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-60"
                  >
                    {isSkipping ? 'Skipping...' : 'Continue to next step'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pt-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16">
        {sessionQuestionId && (
          <Card className="bg-surface-interactive border border-border-subtle rounded-3xl overflow-hidden shadow-lift transition-all duration-500 hover:border-border-interactive">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-bold tracking-tight text-text-primary">Session coding assessment</CardTitle>
              <CardDescription className="text-lg text-text-secondary mt-1">
                Solve this challenge, then continue the session.
              </CardDescription>
              {isSessionPracticeItem && currentSessionItem?.intent?.text && (
                <p className="text-sm text-text-secondary">
                  <span className="font-semibold">Why this next:</span> {currentSessionItem.intent.text}
                </p>
              )}
              {isSessionPracticeItem && (currentSessionItem?.targetConcept || currentSessionItem?.primaryConceptSlug) && (
                <p className="text-xs uppercase tracking-[0.08em] text-text-muted">
                  Target: {currentSessionItem?.targetConcept || currentSessionItem?.primaryConceptSlug}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loadingSessionQuestion ? (
                <div className="animate-pulse space-y-4 py-8">
                  <div className="h-8 bg-surface-dense rounded w-3/4 mx-auto" />
                  <div className="h-4 bg-surface-dense rounded w-1/4 mx-auto" />
                </div>
              ) : sessionQuestionError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {sessionQuestionError}
                </div>
              ) : sessionQuestion ? (
                <div className="rounded-2xl border border-border-subtle bg-surface-dense p-6 shadow-inner transition-colors group/q hover:border-accent-primary/30">
                  <p className="text-2xl font-bold text-text-primary mb-3">{sessionQuestion.title}</p>
                  <span className={cn(
                    'inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase',
                    sessionQuestion.difficulty === 'Easy' && 'bg-brand-green/10 text-brand-green ring-1 ring-brand-green/30',
                    sessionQuestion.difficulty === 'Medium' && 'bg-brand-amber/10 text-brand-amber ring-1 ring-brand-amber/30',
                    sessionQuestion.difficulty === 'Hard' && 'bg-brand-gold/10 text-brand-gold ring-1 ring-brand-gold/30'
                  )}>
                    {sessionQuestion.difficulty}
                  </span>
                </div>
              ) : (
                <p className="text-text-muted">Question not found.</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4 px-8 pb-8">
              {sessionQuestion && (
                <Button
                  onClick={() => openWorkspace(sessionQuestion, 'assessment')}
                  disabled={isOpeningWorkspace}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-base font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isOpeningWorkspace ? 'Opening workspace...' : 'Open coding workspace'}
                </Button>
              )}
              {isSessionPracticeItem && (
                <p className="text-xs text-text-muted">
                  Completion is handled in the coding chamber after all tests pass.
                </p>
              )}
            </CardFooter>
            {isSessionPracticeItem && (
              <div className="px-6 pb-6">
                <p className="mt-2 text-xs text-text-muted">
                  Open the coding workspace, run tests, then use ‘Complete challenge & continue’ in the chamber.
                </p>
              </div>
            )}
          </Card>
        )}

        {!sessionQuestionId && (
          <>
            <div className="flex flex-col items-center text-center space-y-4">
              <a
                href="https://www.youtube.com/@jamesperaltaSWE?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="group mb-2 relative inline-block"
              >
                <div className="relative p-1 rounded-full bg-gradient-to-tr from-brand-green via-brand-amber to-brand-gold">
                  <Image
                    src="https://yt3.googleusercontent.com/1yE8FhBsduYXodmbR2TzuJf3DViBwKahmshEktiwcJocxc-3K7kmhQLmYiu_-AUVdWle4aRC=s160-c-k-c0x00ffffff-no-rj"
                    alt="James Peralta"
                    width={96}
                    height={96}
                    className="rounded-full border-4 border-background object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 border-2 border-background transition-transform duration-300 group-hover:scale-110 shadow-lg">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              </a>

              <div className="space-y-2 max-w-2xl">
                <h1 className="text-5xl md:text-6xl font-bold font-sans tracking-tight text-foreground">
                  Peralta Mock Assessment
                </h1>
                <p className="text-muted-foreground text-xl leading-relaxed">
                  Real interview-level questions pulled straight from James’s own prep.
                  No theory dumps. No inflated difficulty. Just problems that actually show up.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {levels.map((level) => (
                <Card
                  key={level.id}
                  className={cn(
                    "flex flex-col relative overflow-hidden transition-all duration-500 bg-surface-interactive border border-border-subtle rounded-3xl shadow-lift hover:border-border-interactive hover:-translate-y-1"
                  )}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-white/5" />

                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner transition-transform duration-500 group-hover:scale-110 bg-surface-dense text-text-primary border border-border-subtle">
                        {level.icon}
                      </div>
                      <Badge variant={level.variant} dot className="shadow-lg backdrop-blur-md">
                        {level.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-bold font-display tracking-tight mt-2">{level.title}</CardTitle>
                    <CardDescription className="line-clamp-3 text-lg leading-relaxed">
                      {level.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 pb-6 relative z-10">
                    <div className="flex items-center gap-3 text-base text-text-secondary bg-surface-dense border border-border-subtle p-4 rounded-2xl">
                      <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-mono text-xs uppercase tracking-widest">{level.questionInfo}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-8 relative z-10 px-6">
                    <Button
                      variant={level.variant}
                      className="w-full h-12 rounded-full font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => handleStart(level.id)}
                      disabled={loading}
                    >
                      {loading && selectedLevel === level.id ? 'Loading...' : 'Start Challenge'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-base text-destructive text-center font-medium animate-in fade-in slide-in-from-bottom-2">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {!sessionQuestionId && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md px-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl bg-surface-interactive shadow-2xl border border-border-subtle rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-bold tracking-tight text-text-primary">Your {selectedLevelLabel} assessment</CardTitle>
                <CardDescription className="text-text-secondary text-lg font-medium">Two non-premium LeetCode questions ready to go.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-10 w-10 p-0 rounded-full hover:bg-surface-dense transition-colors">
                ✕
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 p-8 pt-0">
              {questions.length === 0 ? (
                <div className="rounded-2xl border border-border-subtle bg-surface-dense p-8 text-center text-text-muted italic">
                  No questions returned yet. Please close and try again.
                </div>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface-dense p-6 transition-all duration-300 hover:border-border-interactive group/item"
                  >
                    <div>
                      <p className="text-xl font-bold text-text-primary transition-colors group-hover/item:text-accent-primary">
                        {question.title}
                      </p>
                      <span className={cn(
                        "text-xs px-3 py-1 rounded-full mt-2 inline-block font-bold uppercase tracking-wider",
                        question.difficulty === 'Easy' && "bg-brand-green/10 text-brand-green ring-1 ring-brand-green/20",
                        question.difficulty === 'Medium' && "bg-brand-amber/10 text-brand-amber ring-1 ring-brand-amber/20",
                        question.difficulty === 'Hard' && "bg-brand-gold/10 text-brand-gold ring-1 ring-brand-gold/20"
                      )}>
                        {question.difficulty}
                      </span>
                    </div>
                    {question.url && (
                      <a
                        href={question.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-surface-dense rounded-full"
                        title="View on LeetCode"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                ))
              )}
            </CardContent>

            <CardFooter className="justify-end p-8 pt-0">
              <Button
                variant="outline"
                onClick={handleClose}
                className="rounded-full px-8 py-2 font-bold hover:bg-surface-dense border-border-subtle transition-all"
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
