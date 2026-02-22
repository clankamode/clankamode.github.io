'use client';

import { useEffect, useState } from 'react';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { useRouter } from 'next/navigation';
import { EXECUTION_SURFACE_LAYOUT_CLASS } from './ExecutionSurface';

interface SessionHUDProps {
  onToggleTOC?: () => void;
  viewLabel?: string;
  showViewToggle?: boolean;
  secondaryStatusLabel?: string;
  onLeave?: () => void;
  isViewOpen?: boolean;
}

function formatElapsedTime(startedAt: Date): string {
  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SessionHUD({
  onToggleTOC,
  viewLabel = 'View',
  showViewToggle = true,
  secondaryStatusLabel,
  onLeave,
  isViewOpen = false,
}: SessionHUDProps) {
  const { state, abandonSession } = useSessionContext();
  const router = useRouter();
  const [elapsedTime, setElapsedTime] = useState('0:00');

  useEffect(() => {
    if (state.phase !== 'execution' || !state.execution) {
      return;
    }

    const startedAt = state.execution.startedAt;
    const updateTimer = () => {
      setElapsedTime(formatElapsedTime(startedAt));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [state.phase, state.execution]);

  if (state.phase !== 'execution' || !state.scope || !state.execution) {
    return null;
  }

  const track = state.scope.track;
  const execution = state.execution;
  const scope = state.scope;
  const currentStep = Math.min(execution.currentIndex + 1, scope.items.length);
  const totalSteps = Math.max(scope.items.length, 1);
  const isBusy = state.transitionStatus !== 'ready';
  const isFinalizing = state.transitionStatus === 'finalizing';

  const handleLeave = () => {
    if (isBusy) return;
    if (onLeave) {
      onLeave();
      return;
    }
    abandonSession();
    router.replace('/home');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-interactive/28 bg-background/92">
      <div className={`${EXECUTION_SURFACE_LAYOUT_CLASS} py-1.5`}>
        <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.03em] text-text-muted">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[12px] uppercase text-text-primary/95">Session {track.name}</span>
            <span className="text-text-secondary">{elapsedTime}</span>
            <span className="text-text-muted">{currentStep}/{totalSteps}</span>
            {secondaryStatusLabel ? (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-text-secondary">{secondaryStatusLabel}</span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {showViewToggle && onToggleTOC ? (
              <button
                type="button"
                onClick={onToggleTOC}
                aria-controls="session-view-drawer"
                aria-expanded={isViewOpen}
                className="inline-flex items-center gap-1 border border-transparent px-1 py-0.5 text-[11px] text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-interactive focus-visible:ring-offset-0"
                title={`${viewLabel} options (T)`}
              >
                <span>{viewLabel}</span>
                <span className="text-text-muted">[T]</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleLeave}
              disabled={isBusy}
              className="inline-flex items-center px-1 py-0.5 text-[11px] text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-interactive focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFinalizing ? 'Leaving...' : 'Leave session'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
