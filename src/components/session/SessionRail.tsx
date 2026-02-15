'use client';

import { cn } from '@/lib/utils';
import { useSession as useSessionContext } from '@/contexts/SessionContext';

interface SessionRailProps {
  onToggleDetails: () => void;
}

export default function SessionRail({ onToggleDetails }: SessionRailProps) {
  const { state } = useSessionContext();

  const inExecution = state.phase === 'execution' && !!state.execution && !!state.scope;
  if (!inExecution) {
    return null;
  }

  const execution = state.execution!;
  const scope = state.scope!;
  const totalSteps = scope.items.length;

  const progressPercentage = Math.round(((execution.currentIndex + 1) / totalSteps) * 100);
  const totalChunks = Math.max(execution.totalChunks, 1);
  const currentChunk = Math.min(execution.currentChunk + 1, totalChunks);
  const isComplete = progressPercentage === 100;

  return (
    <div className="space-y-6">
      {/* Overall Session Progress - Items completed */}
      <div className="space-y-3 pr-12">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs uppercase tracking-wider text-text-muted">Progress</span>
          <span className={cn(
            "font-mono text-sm font-medium transition-all duration-300",
            isComplete
              ? "text-emerald-400 animate-pulse"
              : "text-text-primary"
          )}>
            {Math.min(execution.currentIndex + 1, totalSteps)}/{totalSteps}
          </span>
        </div>

        <div className={cn(
          "relative h-2 overflow-hidden rounded-full bg-white/5 transition-all duration-300",
          progressPercentage > 75 && "shadow-lg shadow-emerald-500/20"
        )}>
          <div
            className={cn(
              "absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-blue-500 transition-all duration-500 ease-out",
              isComplete && "shadow-emerald-500/50"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="flex justify-end">
          <span className="text-xs text-text-muted">Sec {currentChunk}/{totalChunks}</span>
        </div>
      </div>

      {/* Details Button */}
      <div className="flex justify-end pr-12">
        <button
          type="button"
          onClick={onToggleDetails}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-wider text-text-secondary backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:bg-white/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Details <span className="font-mono text-text-muted">[T]</span>
        </button>
      </div>
    </div>
  );
}
