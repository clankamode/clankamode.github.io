'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Loader2, Monitor, ArrowLeft, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MonacoWrapper } from './MonacoWrapper';
import { OutputPanel } from './OutputPanel';
import { SuccessOverlay } from './SuccessOverlay';
import { usePythonRunner } from '@/hooks/usePythonRunner';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { logTelemetryEvent } from '@/lib/telemetry';
import type { TestCase, TestCaseResult } from './PythonEditor';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/Resizable';

interface InterviewQuestion {
  id: string;
  leetcode_number: number | null;
  name: string;
  difficulty: string;
  category: string | null;
  pattern: string | null;
  leetcode_url: string | null;
  prompt_full: string;
  starter_code: string;
  helper_code: string;
  test_cases: unknown;
  order_index: number | null;
  source: string[];
}

interface PracticeEditorProps {
  question: InterviewQuestion;
  context?: {
    isSession?: boolean;
    returnTo?: string | null;
    sessionQuestionId?: string | null;
  };
}

const TEST_MARKER = '__TEST_RESULTS__:';

function buildTestRunnerCode(testCases: TestCase[]): string {
  const lines: string[] = [
    '',
    '# ── hidden test runner ──',
    'import json as __json__',
    '__test_results__ = []',
    '',
  ];

  for (const tc of testCases) {
    lines.push('try:');
    lines.push(`    __r__ = ${tc.fnCall}`);
    if (tc.sortResult) {
      lines.push('    __r__ = sorted([sorted(x) if isinstance(x, list) else x for x in __r__]) if isinstance(__r__, list) else __r__');
    }
    lines.push(
      `    __test_results__.append({"id": ${tc.id}, "passed": __r__ == ${tc.expected}, "actual": repr(__r__)})`,
    );
    lines.push('except Exception as __e__:');
    lines.push(
      `    __test_results__.append({"id": ${tc.id}, "passed": False, "actual": "", "error": str(__e__)})`,
    );
    lines.push('');
  }

  lines.push(`print("${TEST_MARKER}" + __json__.dumps(__test_results__))`);
  return lines.join('\n');
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colorClass =
    difficulty === 'Easy'
      ? 'bg-brand-green/10 text-brand-green border-brand-green/30'
      : difficulty === 'Medium'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        : 'bg-red-500/10 text-red-400 border-red-500/30';

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${colorClass}`}>
      {difficulty}
    </span>
  );
}

export function PracticeEditor({ question, context }: PracticeEditorProps) {
  const router = useRouter();
  const { state: sessionFlowState, advanceItem } = useSessionContext();
  const isSessionContext = Boolean(context?.isSession);
  const sessionQuestionId = context?.sessionQuestionId || null;
  const fallbackSessionReturn = question.leetcode_number
    ? `/session/practice/${question.leetcode_number}`
    : `/session/practice/${question.id}`;
  const backHref = context?.returnTo || (isSessionContext ? fallbackSessionReturn : '/peralta75');
  const backLabel = isSessionContext ? 'Session' : 'Back';
  const [code, setCode] = useState(question.starter_code);
  const savedCodeLoadedRef = useRef(false);
  const { isReady, isRunning, isLoading, output, run, reset } = usePythonRunner();

  // Load saved submission code when user has previously passed this question
  useEffect(() => {
    if (savedCodeLoadedRef.current) return;
    savedCodeLoadedRef.current = true;
    fetch(`/api/questions/solved?question_id=${encodeURIComponent(question.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((submission: { source_code?: string | null } | null) => {
        if (submission?.source_code) {
          setCode(submission.source_code);
        }
      })
      .catch(() => {});
  }, [question.id]);
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completingSessionItem, setCompletingSessionItem] = useState(false);
  const completionSubmitLockRef = useRef(false);
  const prevAllPassedRef = useRef(false);
  const currentSessionItem = sessionFlowState.phase === 'execution' && sessionFlowState.execution && sessionFlowState.scope
    ? sessionFlowState.scope.items[sessionFlowState.execution.currentIndex] || null
    : null;
  const nextSessionItem = sessionFlowState.phase === 'execution' && sessionFlowState.execution && sessionFlowState.scope
    ? sessionFlowState.scope.items[sessionFlowState.execution.currentIndex + 1] || null
    : null;
  const chamberMeta = sessionFlowState.phase === 'execution' && sessionFlowState.execution && sessionFlowState.scope
    ? {
      step: sessionFlowState.execution.currentIndex + 1,
      total: sessionFlowState.scope.items.length,
      track: sessionFlowState.scope.track.name,
    }
    : null;
  const telemetrySessionId = sessionFlowState.execution?.sessionId || sessionFlowState.scope?.sessionId || 'session_practice';
  const telemetryTrackSlug = sessionFlowState.scope?.track.slug || 'dsa';
  const telemetryUserId = sessionFlowState.scope?.userId;
  const isPeraltaQuestion = question.source.includes('PERALTA_75');
  const attemptedProgressSyncedRef = useRef(false);
  const solvedProgressSyncedRef = useRef(false);

  const testCases = question.test_cases as TestCase[];
  const allTestsPassed =
    testResults.length === testCases.length &&
    testResults.length > 0 &&
    testResults.every((result) => result.passed);

  const syncPeraltaProgress = useCallback(async (status: 'attempted' | 'solved') => {
    if (!isPeraltaQuestion || !question.leetcode_number) {
      return;
    }

    if (status === 'attempted' && attemptedProgressSyncedRef.current) {
      return;
    }

    if (status === 'solved' && solvedProgressSyncedRef.current) {
      return;
    }

    const response = await fetch('/api/peralta75/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updates: [{ leetcodeNumber: question.leetcode_number, status, origin: 'execution' }],
      }),
    });

    if (!response.ok) {
      return;
    }

    if (status === 'attempted') {
      attemptedProgressSyncedRef.current = true;
      return;
    }

    solvedProgressSyncedRef.current = true;
    attemptedProgressSyncedRef.current = true;
  }, [isPeraltaQuestion, question.leetcode_number]);

  const handleRun = useCallback(() => {
    const helperCode = question.helper_code || '';
    const testRunner = buildTestRunnerCode(testCases);
    const fullCode = helperCode + '\n' + code + '\n' + testRunner;
    setTestResults([]);
    setHasRun(true);
    prevAllPassedRef.current = false;
    if (isSessionContext && sessionQuestionId) {
      window.sessionStorage.setItem(`session:practice:ran:${sessionQuestionId}`, '1');
      logTelemetryEvent({
        userId: telemetryUserId,
        trackSlug: telemetryTrackSlug,
        sessionId: telemetrySessionId,
        eventType: 'practice_tests_ran',
        mode: 'execute',
        payload: {
          questionId: sessionQuestionId,
          leetcodeNumber: question.leetcode_number,
        },
        dedupeKey: `practice_tests_ran_${telemetrySessionId}_${sessionQuestionId}`,
      });
    }
    run(fullCode);

    void syncPeraltaProgress('attempted');
  }, [
    code,
    question.helper_code,
    question.leetcode_number,
    testCases,
    run,
    isSessionContext,
    sessionQuestionId,
    telemetrySessionId,
    telemetryTrackSlug,
    telemetryUserId,
    syncPeraltaProgress,
  ]);

  useEffect(() => {
    if (isRunning) return;
    for (const line of output) {
      if (line.text.startsWith(TEST_MARKER)) {
        const json = line.text.slice(TEST_MARKER.length);
        setTestResults(JSON.parse(json));
        break;
      }
    }
  }, [output, isRunning]);

  useEffect(() => {
    if (isRunning) return;
    const allPassed =
      testResults.length === testCases.length &&
      testResults.length > 0 &&
      testResults.every((r) => r.passed);

    if (allPassed && !prevAllPassedRef.current) {
      prevAllPassedRef.current = true;
      setShowSuccess(true);
      // Record solve and source code in DB when all test cases pass in code execution
      fetch('/api/questions/solved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: question.id, solved: true, source_code: code }),
      }).catch(() => {});
    }
  }, [testResults, isRunning, testCases.length, question.id, code]);

  useEffect(() => {
    if (isSessionContext || !allTestsPassed) {
      return;
    }

    void syncPeraltaProgress('solved');
  }, [allTestsPassed, isSessionContext, syncPeraltaProgress]);

  const visibleOutput = output.filter((line) => !line.text.startsWith(TEST_MARKER));

  const statusText = isLoading
    ? 'Loading Pyodide…'
    : isRunning
      ? 'Running Python 3 (Pyodide)…'
      : 'Python 3 (Pyodide)';
  const completionLabel = completingSessionItem
    ? 'Completing...'
    : allTestsPassed
      ? 'Complete challenge & continue'
      : 'Pass all tests to continue';
  const completionHint = allTestsPassed
    ? 'All tests passing. Completion unlocked.'
    : hasRun
      ? `${testResults.filter((result) => result.passed).length}/${testCases.length} tests passing. Pass all tests to unlock completion.`
      : 'Run tests to unlock completion.';
  const canAttemptSessionComplete =
    allTestsPassed &&
    !completingSessionItem &&
    !!currentSessionItem &&
    !!sessionQuestionId &&
    !isRunning &&
    sessionFlowState.transitionStatus === 'ready' &&
    sessionFlowState.execution?.transitionStatus === 'ready';

  useEffect(() => {
    completionSubmitLockRef.current = false;
    setCompletingSessionItem(false);
  }, [sessionQuestionId]);

  useEffect(() => {
    if (!isSessionContext) {
      completionSubmitLockRef.current = false;
      setCompletingSessionItem(false);
    }
  }, [isSessionContext]);

  const handleSessionComplete = useCallback(() => {
    if (!isSessionContext || !sessionQuestionId) return;
    if (completingSessionItem || completionSubmitLockRef.current) return;
    if (sessionFlowState.phase !== 'execution' || !sessionFlowState.execution || !sessionFlowState.scope) return;
    if (!allTestsPassed || isRunning || sessionFlowState.transitionStatus !== 'ready' || sessionFlowState.execution.transitionStatus !== 'ready') {
      return;
    }

    completionSubmitLockRef.current = true;
    setCompletingSessionItem(true);
    void syncPeraltaProgress('solved');
    logTelemetryEvent({
      userId: telemetryUserId,
      trackSlug: telemetryTrackSlug,
      sessionId: telemetrySessionId,
      eventType: 'practice_completion_confirmed',
      mode: 'execute',
      payload: {
        questionId: sessionQuestionId,
        via: 'tests_passed',
      },
      dedupeKey: `practice_completion_confirmed_${telemetrySessionId}_${sessionQuestionId}`,
    });

    advanceItem();
    if (nextSessionItem) {
      router.push(nextSessionItem.href);
    } else {
      router.push('/home');
    }

    window.setTimeout(() => {
      completionSubmitLockRef.current = false;
      setCompletingSessionItem(false);
    }, 2500);
  }, [
    isSessionContext,
    sessionQuestionId,
    completingSessionItem,
    sessionFlowState,
    allTestsPassed,
    isRunning,
    telemetryUserId,
    telemetryTrackSlug,
    telemetrySessionId,
    advanceItem,
    nextSessionItem,
    router,
    syncPeraltaProgress,
  ]);

  return (
    <>
      <div className="flex md:hidden h-screen items-center justify-center bg-surface-ambient px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Monitor className="h-10 w-10 text-text-muted" />
          <h2 className="text-lg font-semibold text-foreground">Desktop Only</h2>
          <p className="max-w-xs text-sm text-text-secondary">
            The code editor requires a larger screen.
          </p>
        </div>
      </div>

      <div className="hidden md:flex h-screen flex-col overflow-hidden bg-surface-workbench">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(backHref)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-foreground hover:bg-surface-interactive transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </button>
            <div className="h-5 w-px bg-border-subtle" />
            {question.leetcode_number && (
              <span className="font-mono text-xs text-text-muted">#{question.leetcode_number}</span>
            )}
            {isSessionContext && chamberMeta && (
              <span className="rounded-full border border-border-interactive bg-surface-interactive px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-text-muted">
                {chamberMeta.track} · Step {chamberMeta.step}/{chamberMeta.total}
              </span>
            )}
            <span className="font-semibold text-sm text-foreground truncate max-w-[300px]">
              {question.name}
            </span>
            <DifficultyBadge difficulty={question.difficulty} />
          </div>
          {!isSessionContext && question.leetcode_url && (
            <a
              href={question.leetcode_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-foreground hover:bg-surface-interactive transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View source
            </a>
          )}

        </div>
        {isSessionContext && (
          <div className="border-b border-border-subtle bg-surface-interactive px-4 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">Goal:</span> pass tests, then complete challenge.
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {completionHint}
                </p>
                {nextSessionItem && (
                  <p className="mt-1 text-xs text-text-muted">
                    Next: {nextSessionItem.title}
                  </p>
                )}
              </div>
              <button
                onClick={handleSessionComplete}
                disabled={!canAttemptSessionComplete}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors bg-brand-green text-white hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:bg-surface-dense disabled:text-text-muted"
              >
                {completionLabel}
              </button>
            </div>
          </div>
        )}

        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-2">
                <button
                  onClick={handleRun}
                  disabled={!isReady || isRunning}
                  className="flex items-center gap-2 rounded-md bg-brand-green px-4 py-1.5 font-mono text-sm font-semibold text-white transition-all hover:bg-brand-green/85 disabled:opacity-50"
                >
                  {isRunning ? (
                    <>Running <Loader2 className="h-3.5 w-3.5 animate-spin" /></>
                  ) : (
                    <>Run <Play className="h-3.5 w-3.5 fill-current" /></>
                  )}
                </button>
                <span className="font-mono text-sm text-text-secondary">{statusText}</span>
              </div>

              <div className="flex-1 overflow-hidden">
                <MonacoWrapper
                  value={code}
                  onChange={setCode}
                  onRun={handleRun}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={50} minSize={25}>
            <OutputPanel
              output={visibleOutput}
              isRunning={isRunning}
              onReset={reset}
              testCases={testCases}
              testResults={testResults}
              hasRun={hasRun}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <SuccessOverlay
        show={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        passedCount={testResults.filter((r) => r.passed).length}
        totalCount={testCases.length}
      />
    </>
  );
}
