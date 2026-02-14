'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Circle, Loader2 } from 'lucide-react';
import type { TestCase, TestCaseResult } from './PythonEditor';

interface TestCasesPanelProps {
  testCases: TestCase[];
  testResults: TestCaseResult[];
  isRunning: boolean;
  hasRun: boolean;
}

export function TestCasesPanel({ testCases, testResults, isRunning, hasRun }: TestCasesPanelProps) {
  const [selectedId, setSelectedId] = useState(0);

  const resultMap = new Map(testResults.map((r) => [r.id, r]));
  const selected = testCases.find((tc) => tc.id === selectedId) ?? testCases[0];
  const selectedResult = resultMap.get(selected.id);

  const passedCount = testResults.filter((r) => r.passed).length;
  const allPassed = testResults.length === testCases.length && passedCount === testCases.length;

  return (
    <div className="flex h-full">
      <div className="flex w-44 shrink-0 flex-col border-r border-border-subtle">
        <div className="border-b border-border-subtle px-3 py-2.5">
          {isRunning ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-green" />
              <span className="text-xs font-medium text-text-secondary">Running…</span>
            </div>
          ) : hasRun && testResults.length > 0 ? (
            <span
              className={`text-xs font-semibold ${allPassed ? 'text-brand-green' : 'text-red-400'}`}
            >
              {allPassed
                ? 'All tests passed'
                : `${passedCount}/${testCases.length} passed`}
            </span>
          ) : (
            <span className="text-xs text-text-secondary">
              {testCases.length} test cases
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {testCases.map((tc) => {
            const result = resultMap.get(tc.id);
            const isSelected = tc.id === selectedId;

            return (
              <button
                key={tc.id}
                onClick={() => setSelectedId(tc.id)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-surface-interactive text-foreground'
                    : 'text-text-secondary hover:bg-surface-interactive/50 hover:text-foreground'
                }`}
              >
                <StatusIcon result={result} isRunning={isRunning} hasRun={hasRun} />
                <span className="truncate font-mono text-xs">{tc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isRunning ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
            <span className="text-sm text-text-secondary">Running tests…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {hasRun && selectedResult && (
              <DetailSection label="Status">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    selectedResult.passed
                      ? 'bg-brand-green/10 text-brand-green'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {selectedResult.passed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Passed
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Failed
                    </>
                  )}
                </span>
              </DetailSection>
            )}

            <DetailSection label="Input">
              <CodeBlock>{selected.input}</CodeBlock>
            </DetailSection>

            <DetailSection label="Expected Output">
              <CodeBlock>{selected.expectedOutput}</CodeBlock>
            </DetailSection>

            {hasRun && selectedResult && (
              <DetailSection label="Your Output">
                <CodeBlock
                  variant={
                    selectedResult.error
                      ? 'error'
                      : selectedResult.passed
                        ? 'success'
                        : 'error'
                  }
                >
                  {selectedResult.error
                    ? selectedResult.error
                    : selectedResult.actual || 'None'}
                </CodeBlock>
              </DetailSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({
  result,
  isRunning,
  hasRun,
}: {
  result?: TestCaseResult;
  isRunning: boolean;
  hasRun: boolean;
}) {
  if (isRunning) {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-text-muted" />;
  }
  if (!hasRun || !result) {
    return <Circle className="h-4 w-4 shrink-0 text-text-muted" />;
  }
  if (result.passed) {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />;
  }
  return <XCircle className="h-4 w-4 shrink-0 text-red-400" />;
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function CodeBlock({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: 'success' | 'error';
}) {
  const borderClass =
    variant === 'success'
      ? 'border-brand-green/30'
      : variant === 'error'
        ? 'border-red-500/30'
        : 'border-border-subtle';

  return (
    <pre
      className={`overflow-x-auto rounded-lg border ${borderClass} bg-surface-workbench px-4 py-3 font-mono text-sm leading-relaxed text-foreground`}
    >
      {children}
    </pre>
  );
}
