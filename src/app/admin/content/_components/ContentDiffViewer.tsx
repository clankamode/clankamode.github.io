'use client';

import { useMemo } from 'react';
import { diffLines, type Change } from 'diff';

interface ContentDiffViewerProps {
  currentContent: string;
  proposedContent: string;
  className?: string;
}

export default function ContentDiffViewer({
  currentContent,
  proposedContent,
  className = '',
}: ContentDiffViewerProps) {
  const changes = useMemo(() => {
    return diffLines(currentContent, proposedContent);
  }, [currentContent, proposedContent]);

  return (
    <div
      className={`overflow-auto rounded-lg border border-border-subtle bg-surface-dense font-mono text-[13px] leading-relaxed ${className}`}
      role="figure"
      aria-label="Diff: current vs proposed article"
    >
      <div className="min-w-0">
        {changes.map((part: Change, index: number) => {
          if (!part.value) {
            return null;
          }
          const lines = part.value.split('\n');
          const isRemove = part.added === undefined && part.removed;
          const isAdd = part.added;

          return (
            <div key={index}>
              {lines.map((line, lineIndex) => {
                const isLast = lineIndex === lines.length - 1 && line === '';
                if (isLast && lines.length > 1) {
                  return null;
                }
                const lineContent = line || ' ';
                return (
                  <div
                    key={`${index}-${lineIndex}`}
                    className={`flex min-h-[1.5em] items-start gap-2 px-3 py-0.5 ${
                      isRemove
                        ? 'bg-red-500/10 text-red-300'
                        : isAdd
                          ? 'bg-brand-green/10 text-brand-green'
                          : 'text-text-secondary'
                    }`}
                  >
                    <span className="select-none shrink-0 w-6 text-right text-text-muted tabular-nums">
                      {isRemove ? '−' : isAdd ? '+' : ' '}
                    </span>
                    <span className="break-all whitespace-pre-wrap">{lineContent}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
