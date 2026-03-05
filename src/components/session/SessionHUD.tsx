'use client';

import { useEffect, useState } from 'react';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { useRouter } from 'next/navigation';
import { EXECUTION_SURFACE_LAYOUT_CLASS } from './ExecutionSurface';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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

  const handleLeaveConfirm = () => {
    if (isBusy) return;
    if (onLeave) {
      onLeave();
      return;
    }
    abandonSession();
    router.replace('/home');
  };

  const requestLeave = () => {
    if (isBusy) return;
    setShowLeaveConfirm(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-interactive/28 bg-background/92">
      <div className={`${EXECUTION_SURFACE_LAYOUT_CLASS} py-1.5`}>
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] tracking-[0.03em] text-text-muted">
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            <span className="max-w-[10rem] truncate text-[12px] uppercase text-text-primary/95 sm:max-w-none">
              Session {track.name}
            </span>
            <span className="shrink-0 text-text-secondary">{elapsedTime}</span>
            <span className="shrink-0 text-text-muted">{currentStep}/{totalSteps}</span>
            {secondaryStatusLabel ? (
              <>
                <span className="hidden text-text-muted sm:inline">·</span>
                <span className="hidden text-text-secondary sm:inline">{secondaryStatusLabel}</span>
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {showViewToggle && onToggleTOC ? (
              <button
                type="button"
                onClick={onToggleTOC}
                aria-controls="session-view-drawer"
                aria-expanded={isViewOpen}
                className="inline-flex min-h-[44px] items-center gap-1 border border-transparent px-2 py-0.5 text-[11px] text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-interactive focus-visible:ring-offset-0"
                title={`${viewLabel} options (T)`}
              >
                <span>{viewLabel}</span>
                <span className="hidden text-text-muted sm:inline">[T]</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={requestLeave}
              disabled={isBusy}
              className="inline-flex min-h-[44px] items-center px-2 py-0.5 text-[11px] text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-interactive focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFinalizing ? 'Leaving...' : (
                <>
                  <span className="hidden sm:inline">Leave session</span>
                  <span className="sm:hidden">Leave</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </header>

      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeaveConfirm}
        title="Leave session?"
        message="Your current session will end and you will return to Home."
        confirmLabel="Leave session"
        cancelLabel="Stay"
        confirmVariant="primary"
      />
    </>
  );
}
