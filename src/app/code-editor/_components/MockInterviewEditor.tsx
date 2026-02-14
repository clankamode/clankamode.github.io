'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Loader2, Monitor, Lock, Check, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MonacoWrapper } from './MonacoWrapper';
import { OutputPanel } from './OutputPanel';
import { SuccessOverlay } from './SuccessOverlay';
import { CountdownTimer } from './CountdownTimer';
import { usePythonRunner } from '@/hooks/usePythonRunner';
import type { TestCase, TestCaseResult } from './PythonEditor';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/Resizable';

interface InterviewQuestion {
  id: string;
  name: string;
  leetcode_number: number | null;
  difficulty: string;
  prompt_full: string;
  starter_code: string;
  helper_code: string;
  test_cases: unknown;
  video_ids: string[] | null;
}

interface MockInterviewEditorProps {
  questions: [InterviewQuestion, InterviewQuestion];
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
      lines.push('    __r__ = sorted(__r__) if isinstance(__r__, list) else __r__');
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

function TimesUpOverlay({ onExit }: { onExit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="text-6xl font-bold text-red-400">Time&apos;s Up!</div>
        <p className="text-xl text-text-secondary max-w-md">
          Your 50-minute mock interview has ended.
        </p>
        <button
          onClick={onExit}
          className="flex items-center gap-2 rounded-lg bg-brand-green px-6 py-3 font-semibold text-white transition-all hover:bg-brand-green/85"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessment
        </button>
      </div>
    </div>
  );
}

const TOTAL_TIME = 3000;

export function MockInterviewEditor({ questions }: MockInterviewEditorProps) {
  const router = useRouter();
  const [activeQ, setActiveQ] = useState<0 | 1>(0);
  const [q1Code, setQ1Code] = useState(questions[0].starter_code);
  const [q2Code, setQ2Code] = useState(questions[1].starter_code);
  const [q1Solved, setQ1Solved] = useState(false);
  const [q2Solved, setQ2Solved] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false);

  const { isReady, isRunning, isLoading, output, run, reset } = usePythonRunner();
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const prevAllPassedRef = useRef(false);

  const q1TestCases = questions[0].test_cases as TestCase[];
  const q2TestCases = questions[1].test_cases as TestCase[];
  const activeTestCases = activeQ === 0 ? q1TestCases : q2TestCases;
  const activeCode = activeQ === 0 ? q1Code : q2Code;
  const setActiveCode = activeQ === 0 ? setQ1Code : setQ2Code;

  const handleRun = useCallback(() => {
    const helperCode = questions[activeQ].helper_code || '';
    const testRunner = buildTestRunnerCode(activeTestCases);
    const fullCode = helperCode + '\n' + activeCode + '\n' + testRunner;
    setTestResults([]);
    setHasRun(true);
    prevAllPassedRef.current = false;
    run(fullCode);
  }, [activeCode, activeQ, activeTestCases, questions, run]);

  useEffect(() => {
    if (isRunning) return;
    for (const line of output) {
      if (line.text.startsWith(TEST_MARKER)) {
        try {
          const json = line.text.slice(TEST_MARKER.length);
          setTestResults(JSON.parse(json));
        } catch {
        }
        break;
      }
    }
  }, [output, isRunning]);

  useEffect(() => {
    if (isRunning) return;

    const allPassed =
      testResults.length === activeTestCases.length &&
      testResults.length > 0 &&
      testResults.every((r) => r.passed);

    if (allPassed && !prevAllPassedRef.current) {
      prevAllPassedRef.current = true;

      if (activeQ === 0 && !q1Solved) {
        setQ1Solved(true);
        setShowSuccess(true);
      } else if (activeQ === 1 && !q2Solved) {
        setQ2Solved(true);
        setShowAllDone(true);
      }
    }
  }, [testResults, isRunning, activeQ, activeTestCases.length, q1Solved, q2Solved]);

  const handleQ1SuccessDismiss = useCallback(() => {
    setShowSuccess(false);
    setActiveQ(1);
    setTestResults([]);
    setHasRun(false);
    reset();
  }, [reset]);

  const handleAllDoneDismiss = useCallback(() => {
    setShowAllDone(false);
    setIsFinished(true);
  }, []);

  const handleTimeUp = useCallback(() => {
    setIsFinished(true);
  }, []);

  const handleTabSwitch = useCallback((idx: 0 | 1) => {
    if (idx === 1 && !q1Solved) return;
    setActiveQ(idx);
    setTestResults([]);
    setHasRun(false);
    reset();
  }, [q1Solved, reset]);

  const visibleOutput = output.filter((line) => !line.text.startsWith(TEST_MARKER));

  const statusText = isLoading
    ? 'Loading Pyodide…'
    : isRunning
      ? 'Running Python 3 (Pyodide)…'
      : 'Python 3 (Pyodide)';

  return (
    <>
      <div className="flex md:hidden h-screen items-center justify-center bg-surface-ambient px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Monitor className="h-10 w-10 text-text-muted" />
          <h2 className="text-lg font-semibold text-foreground">Desktop Only</h2>
          <p className="max-w-xs text-sm text-text-secondary">
            The mock interview editor requires a larger screen.
          </p>
        </div>
      </div>

      <div className="hidden md:flex h-screen flex-col overflow-hidden bg-surface-workbench">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabSwitch(0)}
              className={`
                flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all
                ${activeQ === 0
                  ? 'bg-brand-green/15 text-brand-green border border-brand-green/30'
                  : 'bg-surface-interactive text-text-secondary hover:text-foreground border border-transparent'
                }
              `}
            >
              {q1Solved ? (
                <Check className="h-4 w-4 text-brand-green" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-dense text-xs font-bold">1</span>
              )}
              <span className="truncate max-w-[200px]">{questions[0].name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                questions[0].difficulty === 'Easy' ? 'bg-brand-green/10 text-brand-green' :
                questions[0].difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {questions[0].difficulty}
              </span>
            </button>

            <button
              onClick={() => handleTabSwitch(1)}
              disabled={!q1Solved}
              className={`
                flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all
                ${!q1Solved
                  ? 'opacity-50 cursor-not-allowed bg-surface-interactive text-text-secondary border border-transparent'
                  : activeQ === 1
                    ? 'bg-brand-green/15 text-brand-green border border-brand-green/30'
                    : 'bg-surface-interactive text-text-secondary hover:text-foreground border border-transparent'
                }
              `}
            >
              {q2Solved ? (
                <Check className="h-4 w-4 text-brand-green" />
              ) : !q1Solved ? (
                <Lock className="h-4 w-4" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-dense text-xs font-bold">2</span>
              )}
              <span className="truncate max-w-[200px]">{questions[1].name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                questions[1].difficulty === 'Easy' ? 'bg-brand-green/10 text-brand-green' :
                questions[1].difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {questions[1].difficulty}
              </span>
            </button>
          </div>

          <CountdownTimer totalSeconds={TOTAL_TIME} onTimeUp={handleTimeUp} />
        </div>

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
                  value={activeCode}
                  onChange={setActiveCode}
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
              testCases={activeTestCases}
              testResults={testResults}
              hasRun={hasRun}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <SuccessOverlay
        show={showSuccess}
        onDismiss={handleQ1SuccessDismiss}
        passedCount={q1TestCases.length}
        totalCount={q1TestCases.length}
      />

      <SuccessOverlay
        show={showAllDone}
        onDismiss={handleAllDoneDismiss}
        passedCount={q1TestCases.length + q2TestCases.length}
        totalCount={q1TestCases.length + q2TestCases.length}
      />

      {isFinished && <TimesUpOverlay onExit={() => router.push('/assessment')} />}
    </>
  );
}
