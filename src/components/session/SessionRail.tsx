'use client';

import { BookOpen, Code2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

export default function SessionRail() {
  const { state } = useSession();
  if (state.phase !== 'execution' || !state.scope || !state.execution) {
    return null;
  }

  return (
    <div className="space-y-3">
      {state.scope.items.map((item, index) => {
        const isCurrent = state.execution ? index === state.execution.currentIndex : false;
        const isCompleted = state.execution ? index < state.execution.currentIndex : false;
        const isPractice = item.type === 'practice';
        const railState = isCurrent ? 'current' : isCompleted ? 'completed' : 'upcoming';
        const itemLabel = isPractice
          ? `Practice: ${item.questionName || item.title.replace(/^Practice:\s*/i, '')}`
          : item.title;

        return (
          <div
            key={`${item.href}-${index}`}
            data-session-rail-state={railState}
            className="flex items-start gap-2"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                isCurrent
                  ? 'border-accent-primary bg-accent-primary/12 text-accent-primary ring-1 ring-accent-primary/25'
                  : isCompleted
                    ? 'border-border-interactive/60 bg-surface-interactive/22 text-text-secondary'
                    : 'border-border-subtle bg-transparent text-text-muted'
              }`}
              aria-hidden="true"
            >
              {isPractice ? <Code2 className="h-2.5 w-2.5" /> : <BookOpen className="h-2.5 w-2.5" />}
            </span>
            {isCurrent ? null : (
              <p
                className={`font-mono text-[10px] leading-4 ${
                  isCompleted ? 'text-text-secondary' : 'text-text-muted'
                }`}
                title={itemLabel}
              >
                {itemLabel}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
