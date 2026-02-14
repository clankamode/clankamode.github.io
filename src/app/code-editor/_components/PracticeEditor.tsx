'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Loader2, Monitor, ArrowLeft, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MonacoWrapper } from './MonacoWrapper';
import { OutputPanel } from './OutputPanel';
import { SuccessOverlay } from './SuccessOverlay';
import { usePythonRunner } from '@/hooks/usePythonRunner';
import type { TestCase, TestCaseResult } from './PythonEditor';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/Resizable';

/* ── Types ─────────────────────────────────────────────────────── */

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
}

/* ── Test runner builder ───────────────────────────────────────── */

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

/* ── Difficulty badge ──────────────────────────────────────────── */

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

/* ── Main Component ────────────────────────────────────────────── */

export function PracticeEditor({ question }: PracticeEditorProps) {
  const router = useRouter();
  const [code, setCode] = useState(question.starter_code);
  const { isReady, isRunning, isLoading, output, run, reset } = usePythonRunner();
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const prevAllPassedRef = useRef(false);

  const testCases = question.test_cases as TestCase[];

  const handleRun = useCallback(() => {
    const helperCode = question.helper_code || '';
    const testRunner = buildTestRunnerCode(testCases);
    const fullCode = helperCode + '\n' + code + '\n' + testRunner;
    setTestResults([]);
    setHasRun(true);
    prevAllPassedRef.current = false;
    run(fullCode);
  }, [code, question.helper_code, testCases, run]);

  // Parse test results from output
  useEffect(() => {
    if (isRunning) return;
    for (const line of output) {
      if (line.text.startsWith(TEST_MARKER)) {
        try {
          const json = line.text.slice(TEST_MARKER.length);
          setTestResults(JSON.parse(json));
        } catch {
          // ignore malformed
        }
        break;
      }
    }
  }, [output, isRunning]);

  // Show success overlay when all tests pass
  useEffect(() => {
    if (isRunning) return;
    const allPassed =
      testResults.length === testCases.length &&
      testResults.length > 0 &&
      testResults.every((r) => r.passed);

    if (allPassed && !prevAllPassedRef.current) {
      prevAllPassedRef.current = true;
      setShowSuccess(true);
    }
  }, [testResults, isRunning, testCases.length]);

  const visibleOutput = output.filter((line) => !line.text.startsWith(TEST_MARKER));

  const statusText = isLoading
    ? 'Loading Pyodide…'
    : isRunning
      ? 'Running Python 3 (Pyodide)…'
      : 'Python 3 (Pyodide)';

  return (
    <>
      {/* Mobile gate */}
      <div className="flex md:hidden h-screen items-center justify-center bg-surface-ambient px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Monitor className="h-10 w-10 text-text-muted" />
          <h2 className="text-lg font-semibold text-foreground">Desktop Only</h2>
          <p className="max-w-xs text-sm text-text-secondary">
            The code editor requires a larger screen.
          </p>
        </div>
      </div>

      {/* Desktop editor */}
      <div className="hidden md:flex h-screen flex-col overflow-hidden bg-surface-workbench">
        {/* Top bar: question info + back button */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/peralta75')}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-foreground hover:bg-surface-interactive transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="h-5 w-px bg-border-subtle" />
            {question.leetcode_number && (
              <span className="font-mono text-xs text-text-muted">#{question.leetcode_number}</span>
            )}
            <span className="font-semibold text-sm text-foreground truncate max-w-[300px]">
              {question.name}
            </span>
            <DifficultyBadge difficulty={question.difficulty} />
            {question.pattern && (
              <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface-interactive">
                {question.pattern}
              </span>
            )}
          </div>
          {question.leetcode_url && (
            <a
              href={question.leetcode_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-foreground hover:bg-surface-interactive transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              LeetCode
            </a>
          )}
        </div>

        {/* Editor + Output */}
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex h-full flex-col">
              {/* Run bar */}
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

              {/* Monaco editor */}
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

      {/* Success celebration */}
      <SuccessOverlay
        show={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        passedCount={testResults.filter((r) => r.passed).length}
        totalCount={testCases.length}
      />
    </>
  );
}
