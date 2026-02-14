'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Loader2, Monitor } from 'lucide-react';
import { MonacoWrapper } from './MonacoWrapper';
import { OutputPanel } from './OutputPanel';
import { SuccessOverlay } from './SuccessOverlay';
import { usePythonRunner } from '@/hooks/usePythonRunner';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/Resizable';

/* ── Test-case data model ──────────────────────────────────────── */

export interface TestCase {
  id: number;
  label: string;
  input: string;       // human-readable multi-line input
  expectedOutput: string; // human-readable expected output
  fnCall: string;      // Python expression, e.g. "two_sum([2,7,11,15], 9)"
  expected: string;    // Python literal for comparison, e.g. "[0, 1]"
  sortResult?: boolean;
}

export interface TestCaseResult {
  id: number;
  passed: boolean;
  actual: string;
  error?: string;
}

/* ── Two Sum test cases ────────────────────────────────────────── */

const TEST_CASES: TestCase[] = [
  {
    id: 0,
    label: 'Test case 0',
    input: 'nums = [2, 7, 11, 15]\ntarget = 9',
    expectedOutput: '[0, 1]',
    fnCall: 'two_sum([2, 7, 11, 15], 9)',
    expected: '[0, 1]',
    sortResult: true,
  },
  {
    id: 1,
    label: 'Test case 1',
    input: 'nums = [3, 2, 4]\ntarget = 6',
    expectedOutput: '[1, 2]',
    fnCall: 'two_sum([3, 2, 4], 6)',
    expected: '[1, 2]',
    sortResult: true,
  },
  {
    id: 2,
    label: 'Test case 2',
    input: 'nums = [3, 3]\ntarget = 6',
    expectedOutput: '[0, 1]',
    fnCall: 'two_sum([3, 3], 6)',
    expected: '[0, 1]',
    sortResult: true,
  },
  {
    id: 3,
    label: 'Test case 3',
    input: 'nums = [1, 5, 3, 7]\ntarget = 8',
    expectedOutput: '[1, 2]',
    fnCall: 'two_sum([1, 5, 3, 7], 8)',
    expected: '[1, 2]',
    sortResult: true,
  },
  {
    id: 4,
    label: 'Test case 4',
    input: 'nums = [-1, -2, -3, -4, -5]\ntarget = -8',
    expectedOutput: '[2, 4]',
    fnCall: 'two_sum([-1, -2, -3, -4, -5], -8)',
    expected: '[2, 4]',
    sortResult: true,
  },
];

/* ── Build hidden test-runner Python code ──────────────────────── */

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

/* ── Default editor code (no asserts — test cases live in the UI) */

const DEFAULT_CODE = `"""
Two Sum

Given an array of integers nums and an integer target, return the indices
of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution,
and you may not use the same element twice.

You can return the answer in any order.

Example 1:
    Input: nums = [2, 7, 11, 15], target = 9
    Output: [0, 1]
    Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
    Input: nums = [3, 2, 4], target = 6
    Output: [1, 2]

Example 3:
    Input: nums = [3, 3], target = 6
    Output: [0, 1]
"""

def two_sum(nums: list[int], target: int) -> list[int]:
    # Write your code here
    pass
`;

/* ── Component ─────────────────────────────────────────────────── */

export function PythonEditor() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const { isReady, isRunning, isLoading, output, run, reset } = usePythonRunner();
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const prevAllPassedRef = useRef(false);

  const handleRun = useCallback(() => {
    const testRunner = buildTestRunnerCode(TEST_CASES);
    const fullCode = code + '\n' + testRunner;
    setTestResults([]);
    setHasRun(true);
    run(fullCode);
  }, [code, run]);

  // Parse test results from output once execution finishes
  useEffect(() => {
    if (isRunning) return;

    for (const line of output) {
      if (line.text.startsWith(TEST_MARKER)) {
        try {
          const json = line.text.slice(TEST_MARKER.length);
          setTestResults(JSON.parse(json));
        } catch {
          // malformed — ignore
        }
        break;
      }
    }
  }, [output, isRunning]);

  // Show success overlay when all tests pass for the first time this run
  useEffect(() => {
    if (isRunning) {
      prevAllPassedRef.current = false;
      return;
    }
    const allPassed =
      testResults.length === TEST_CASES.length &&
      testResults.every((r) => r.passed);

    if (allPassed && !prevAllPassedRef.current) {
      prevAllPassedRef.current = true;
      setShowSuccess(true);
    }
  }, [testResults, isRunning]);

  // Filter __TEST_RESULTS__ lines from visible output
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
            The code editor requires a larger screen. Please switch to a desktop browser.
          </p>
        </div>
      </div>

      {/* Desktop editor */}
      <div className="hidden md:flex h-screen flex-col overflow-hidden bg-surface-workbench">
        <ResizablePanelGroup orientation="horizontal">
          {/* Editor panel */}
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
                    <>
                      Running
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </>
                  ) : (
                    <>
                      Run
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </>
                  )}
                </button>
                <span className="font-mono text-sm text-text-secondary">
                  {statusText}
                </span>
              </div>

              {/* Monaco */}
              <div className="flex-1 overflow-hidden">
                <MonacoWrapper value={code} onChange={setCode} onRun={handleRun} />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Output panel */}
          <ResizablePanel defaultSize={50} minSize={25}>
            <OutputPanel
              output={visibleOutput}
              isRunning={isRunning}
              onReset={reset}
              testCases={TEST_CASES}
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
        totalCount={TEST_CASES.length}
      />
    </>
  );
}
