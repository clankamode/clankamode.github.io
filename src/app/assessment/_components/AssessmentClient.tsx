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
import SessionReaderShell from '@/components/session/SessionReaderShell';
import { sanitizeIntentText } from '@/lib/intent-display';
import { logTelemetryEvent } from '@/lib/telemetry';

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
      description: '2 easy questions to warm up and build confidence. Perfect for beginners.',
      questionInfo: '2 easy questions',
      icon: (
        <svg className="w-6 h-6 text-brand-green" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      variant: 'novice' as const,
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      difficulty: 'Medium',
      description: '1 easy + 1 medium to keep you sharp. Ideal for maintaining your skills.',
      questionInfo: '1 easy + 1 medium',
      icon: (
        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: 'intermediate' as const,
    },
    {
      id: 'faang',
      title: 'FAANG-level',
      difficulty: 'Hard',
      description: '2 medium or a medium + hard for the real deal. Simulate actual interview conditions.',
      questionInfo: '2 medium / 1 medium + 1 hard',
      icon: (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
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

function formatTargetConcept(value: string | null | undefined): string | null {
  if (!value) return null;
  const trailing = value.split('.').pop() || value;
  const label = trailing.replace(/[-_]/g, ' ').trim();
  if (!label) return null;
  return label[0].toUpperCase() + label.slice(1);
}

export default function AssessmentClient({ forcedQuestionId }: AssessmentClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { state: sessionState } = useSessionContext();
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
  const nextSessionItem = useMemo(() => {
    if (sessionState.phase !== 'execution' || !sessionState.scope || !sessionState.execution) {
      return null;
    }
    return sessionState.scope.items[sessionState.execution.currentIndex + 1] || null;
  }, [sessionState]);

  const selectedLevelData = levels.find((level) => level.id === selectedLevel);
  const selectedLevelLabel = selectedLevelData?.title ?? 'Assessment';
  const sessionTarget = formatTargetConcept(
    currentSessionItem?.targetConcept || currentSessionItem?.primaryConceptSlug
  );
  const sessionIntentDisplay = sanitizeIntentText(currentSessionItem?.intent?.text, {
    title: currentSessionItem?.title || null,
    maxChars: 160,
    minChars: 24,
  });

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
    if (!sessionQuestionId) {
      setWorkspaceRunDetected(false);
      setWorkspaceOpenedDetected(false);
      return;
    }

    const readPracticeState = () => {
      try {
        const runKey = getPracticeRunKey(sessionQuestionId);
        const openedKey = getPracticeOpenedKey(sessionQuestionId);
        setWorkspaceRunDetected(window.sessionStorage.getItem(runKey) === '1');
        setWorkspaceOpenedDetected(window.sessionStorage.getItem(openedKey) === '1');
      } catch {
        setWorkspaceRunDetected(false);
        setWorkspaceOpenedDetected(false);
      }
    };

    readPracticeState();
    window.addEventListener('focus', readPracticeState);
    return () => window.removeEventListener('focus', readPracticeState);
  }, [sessionQuestionId]);

  const hasPracticeSignal = workspaceRunDetected || workspaceOpenedDetected;

  const trackSlug = sessionState.scope?.track.slug || 'dsa';
  const telemetrySessionId = sessionState.execution?.sessionId || sessionState.scope?.sessionId || 'session_practice';

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
      <SessionReaderShell
        viewLabel="Details"
        tableOfContents={
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Why this next</p>
              <p className="text-sm text-text-secondary">{sessionIntentDisplay}</p>
            </div>
            {sessionTarget && (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Target</p>
                <p className="text-sm text-text-primary">{sessionTarget}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Shortcuts</p>
              <p className="text-sm text-text-secondary">Press <span className="font-mono text-text-primary">T</span> to toggle this panel.</p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 pb-10">
          <div className="article-spec-header relative border-b border-border-interactive/82 px-1.5 py-2.5 before:absolute before:left-[-2.5rem] before:top-[22px] before:h-px before:w-[2.5rem] before:bg-border-interactive/65 after:absolute after:left-[-2.5rem] after:top-[22px] after:h-1 after:w-1 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-border-interactive/80">
            <p className="article-spec-kicker font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">Session practice</p>
            <h1 className="article-spec-title mt-2 text-4xl font-semibold tracking-tight text-text-primary">Coding assessment</h1>
            <p className="article-spec-subtitle mt-1 text-base text-text-secondary">
              This is a session gate. Solve in the coding chamber, then complete from there to continue.
            </p>
          </div>

          <Card className="rounded-none border-0 bg-transparent shadow-none">
            <CardContent className="space-y-3 pt-4">
              {loadingSessionQuestion ? (
                <p className="text-muted-foreground">Loading question...</p>
              ) : sessionQuestionError ? (
                <div className="rounded-sm border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {sessionQuestionError}
                </div>
              ) : sessionQuestion ? (
                <>
                  <div className="border border-border-interactive/75 bg-transparent p-4 md:p-5">
                    <p className="text-2xl font-semibold leading-tight text-text-primary">{sessionQuestion.title}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex border border-border-subtle/65 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">
                        {sessionQuestion.difficulty}
                      </span>
                      {sessionTarget && (
                        <span className="inline-flex border border-border-subtle/65 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">
                          Target: {sessionTarget}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-border-subtle/55 px-4 py-1.5">
                    <p className="text-sm text-text-secondary">
                      {nextSessionItem
                        ? `After completion: ${nextSessionItem.title}`
                        : 'After completion: continue to the next session step.'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Question not found.</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap items-center gap-2.5 px-6 pb-4 pt-0">
              {sessionQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.sessionStorage.setItem(getPracticeOpenedKey(sessionQuestion.id), '1');
                      setWorkspaceOpenedDetected(true);
                    } catch {
                    }
                    logTelemetryEvent({
                      userId: sessionState.scope?.userId,
                      trackSlug,
                      sessionId: telemetrySessionId,
                      eventType: 'coding_workspace_opened',
                      mode: 'execute',
                      payload: {
                        questionId: sessionQuestion.id,
                        source: 'session',
                      },
                      dedupeKey: `coding_workspace_opened_${telemetrySessionId}_${sessionQuestion.id}`,
                    });
                    router.push(buildPracticeWorkspaceHref(
                      sessionQuestion.id,
                      {
                        source: 'session',
                        returnTo: `/session/practice/${sessionQuestion.id}`,
                        sessionQuestionId: sessionQuestion.id,
                      }
                    ));
                  }}
                  className="inline-flex min-h-[36px] items-center justify-center border border-border-interactive/72 bg-transparent px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {hasPracticeSignal ? 'Resume coding chamber' : 'Open coding chamber'}
                </button>
              )}
            </CardFooter>
            <div className="px-6 pb-5">
              <p className="mt-1.5 text-xs text-text-muted">
                Completion only happens inside the coding chamber after tests pass.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span className={cn(
                  'border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]',
                  workspaceOpenedDetected
                    ? 'border-border-subtle/80 text-text-secondary'
                    : 'border-border-subtle/55 text-text-muted'
                )}>
                  {workspaceOpenedDetected ? 'Workspace opened' : 'Workspace not opened'}
                </span>
                <span className={cn(
                  'border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em]',
                  workspaceRunDetected
                    ? 'border-border-subtle/80 text-text-secondary'
                    : 'border-border-subtle/55 text-text-muted'
                )}>
                  {workspaceRunDetected ? 'Tests run detected' : 'Tests not run yet'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </SessionReaderShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pt-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16">
        {sessionQuestionId && (
          <Card className="frame border-border-interactive bg-surface-workbench">
            <CardHeader>
              <CardTitle className="text-2xl">Session coding assessment</CardTitle>
              <CardDescription>
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
                <p className="text-muted-foreground">Loading question...</p>
              ) : sessionQuestionError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {sessionQuestionError}
                </div>
              ) : sessionQuestion ? (
                <div className="rounded-lg border border-border-subtle bg-surface-interactive p-4">
                  <p className="text-lg font-semibold">{sessionQuestion.title}</p>
                  <span className={cn(
                    'mt-2 inline-block rounded-full px-2 py-0.5 text-xs',
                    sessionQuestion.difficulty === 'Easy' && 'bg-brand-green/10 text-brand-green',
                    sessionQuestion.difficulty === 'Medium' && 'bg-brand-amber/10 text-brand-amber',
                    sessionQuestion.difficulty === 'Hard' && 'bg-brand-gold/10 text-brand-gold'
                  )}>
                    {sessionQuestion.difficulty}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">Question not found.</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap items-center gap-3">
              {sessionQuestion && (
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      window.sessionStorage.setItem(getPracticeOpenedKey(sessionQuestion.id), '1');
                      setWorkspaceOpenedDetected(true);
                    } catch {
                    }
                    logTelemetryEvent({
                      userId: sessionState.scope?.userId,
                      trackSlug,
                      sessionId: telemetrySessionId,
                      eventType: 'coding_workspace_opened',
                      mode: 'execute',
                      payload: {
                        questionId: sessionQuestion.id,
                        source: 'assessment',
                      },
                      dedupeKey: `coding_workspace_opened_${telemetrySessionId}_${sessionQuestion.id}`,
                    });
                    router.push(buildPracticeWorkspaceHref(
                      sessionQuestion.id,
                      {
                        source: 'assessment',
                        returnTo: `/assessment?questionId=${encodeURIComponent(sessionQuestion.id)}`,
                        sessionQuestionId: sessionQuestion.id,
                      }
                    ));
                  }}
                >
                  Open coding workspace
                </Button>
              )}
              {isSessionPracticeItem && (
                <p className="text-xs text-text-muted">
                  Completion is handled in the coding chamber after tests pass.
                </p>
              )}
            </CardFooter>
            {isSessionPracticeItem && (
              <div className="px-6 pb-6">
                <p className="mt-2 text-xs text-text-muted">
                  Open coding workspace at least once, run tests, then complete from the chamber.
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
                    "frame flex flex-col relative overflow-hidden transition-all duration-500 bg-surface-interactive/80 backdrop-blur-none hover:bg-surface-interactive/90 hover:translate-y-[-2px]"
                  )}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-white/5" />

                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-all duration-300 group-hover:scale-110 bg-surface-interactive text-foreground">
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

                  <CardContent className="flex-1 pb-4 relative z-10">
                    <div className="flex items-center gap-2 text-base text-muted-foreground bg-surface-interactive border border-border-subtle p-3 rounded-lg">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-mono text-sm uppercase tracking-wide opacity-80">{level.questionInfo}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 relative z-10">
                    <Button
                      variant={level.variant}
                      className="w-full h-11 shadow-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-ambient/80 backdrop-blur-sm px-4 animate-in fade-in">
          <Card className="frame w-full max-w-lg bg-surface-workbench shadow-2xl border-border-subtle">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-2xl">Your {selectedLevelLabel} assessment</CardTitle>
                <CardDescription>Two non-premium LeetCode questions ready to go.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0 rounded-full">
                ✕
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 pt-4">
              {questions.length === 0 ? (
                <div className="rounded-lg border border-border-subtle bg-surface-interactive p-4 text-center text-base text-muted-foreground">
                  No questions returned yet. Please close and try again.
                </div>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-interactive p-4 hover:border-border-interactive transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {question.title}
                      </p>
                      <span className={cn(
                        "text-sm px-2 py-0.5 rounded-full mt-1 inline-block",
                        question.difficulty === 'Easy' && "bg-brand-green/10 text-brand-green",
                        question.difficulty === 'Medium' && "bg-brand-amber/10 text-brand-amber",
                        question.difficulty === 'Hard' && "bg-brand-gold/10 text-brand-gold"
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

            <CardFooter className="justify-end pt-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
