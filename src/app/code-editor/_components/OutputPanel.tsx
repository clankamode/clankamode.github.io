'use client';

import { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { OutputLine } from '@/hooks/usePythonRunner';
import type { TestCase, TestCaseResult } from './PythonEditor';
import { TestCasesPanel } from './TestCasesPanel';

type Tab = 'output' | 'tests';

interface OutputPanelProps {
  output: OutputLine[];
  isRunning: boolean;
  onReset: () => void;
  testCases: TestCase[];
  testResults: TestCaseResult[];
  hasRun: boolean;
}

const STREAM_CLASSES: Record<OutputLine['stream'], string> = {
  stdout: 'text-foreground',
  stderr: 'text-red-400',
  result: 'text-brand-green',
  system: 'text-text-secondary italic',
};

export function OutputPanel({
  output,
  isRunning,
  onReset,
  testCases,
  testResults,
  hasRun,
}: OutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('output');

  useEffect(() => {
    if (activeTab === 'output') {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [output, activeTab]);

  return (
    <div className="flex h-full flex-col bg-surface-ambient">
      <div className="flex items-center justify-between border-b border-border-subtle px-4">
        <div className="flex items-center gap-1">
          <TabButton
            label="Output"
            isActive={activeTab === 'output'}
            onClick={() => setActiveTab('output')}
            indicator={isRunning ? 'running' : output.length > 0 ? 'idle' : undefined}
          />
          <TabButton
            label="Test Cases"
            isActive={activeTab === 'tests'}
            onClick={() => setActiveTab('tests')}
            badge={
              hasRun && !isRunning && testResults.length > 0
                ? `${testResults.filter((r) => r.passed).length}/${testCases.length}`
                : undefined
            }
            badgeVariant={
              testResults.length === testCases.length &&
              testResults.every((r) => r.passed)
                ? 'success'
                : 'error'
            }
          />
        </div>
        <button
          onClick={onReset}
          className="rounded-md border border-border-subtle px-3 py-1 font-mono text-xs text-text-secondary transition-colors hover:bg-surface-interactive hover:text-foreground"
        >
          Reset
        </button>
      </div>

      {activeTab === 'tests' ? (
        <TestCasesPanel
          testCases={testCases}
          testResults={testResults}
          isRunning={isRunning}
          hasRun={hasRun}
        />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed">
          {isRunning ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
              <span className="text-sm text-text-secondary">Running&hellip;</span>
            </div>
          ) : (
            <>
              {output.map((line, i) => (
                <div key={i} className={`whitespace-pre-wrap ${STREAM_CLASSES[line.stream]}`}>
                  {line.text}
                </div>
              ))}
              <div className="mt-2 flex items-center">
                <span className="text-brand-green">{'>>>'}</span>
                <span className="ml-2 inline-block h-4 w-[2px] animate-pulse bg-foreground" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  isActive,
  onClick,
  indicator,
  badge,
  badgeVariant,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  indicator?: 'running' | 'idle';
  badge?: string;
  badgeVariant?: 'success' | 'error';
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-2.5 font-mono text-sm transition-colors ${
        isActive
          ? 'text-foreground'
          : 'text-text-secondary hover:text-foreground'
      }`}
    >
      {label}

      {indicator === 'running' && (
        <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
      )}
      {indicator === 'idle' && (
        <span className="h-2 w-2 rounded-full bg-brand-green/50" />
      )}

      {badge && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
            badgeVariant === 'success'
              ? 'bg-brand-green/15 text-brand-green'
              : 'bg-red-500/15 text-red-400'
          }`}
        >
          {badge}
        </span>
      )}

      {isActive && (
        <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-brand-green" />
      )}
    </button>
  );
}
