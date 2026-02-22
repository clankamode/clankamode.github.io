'use client';

import { useState } from 'react';
import { logTelemetryEvent } from '@/lib/telemetry';
import { useSession } from 'next-auth/react';

interface CompletionButtonProps {
  articleId: string;
  initialCompleted?: boolean;
}

export default function CompletionButton({
  articleId,
  initialCompleted = false,
}: CompletionButtonProps) {
  const { data: authData } = useSession();
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleToggle = async () => {
    if (status !== 'idle') return;

    const nextState = !isCompleted;
    setStatus('loading');

    const startTime = Date.now();

    try {
      const idempotencyKey = `standalone:${articleId}:${nextState ? 'complete' : 'uncomplete'}`;
      const response = await fetch('/api/progress/complete', {
        method: nextState ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({ articleId }),
      });

      const elapsed = Date.now() - startTime;
      const minLoadTime = 300;
      if (elapsed < minLoadTime) {
        await new Promise(r => setTimeout(r, minLoadTime - elapsed));
      }

      if (response.ok) {
        setIsCompleted(nextState);
        setStatus('success');

        if (nextState && authData?.user?.email) {
          logTelemetryEvent({
            userId: authData.user.email,
            trackSlug: 'standalone', // Fallback as track isn't easily available here
            sessionId: 'standalone_completion',
            eventType: 'item_completed',
            mode: 'execute',
            payload: {
              articleId,
              itemHref: `/learn/standalone/${articleId}`, // Heuristic
            },
            dedupeKey: `complete_${authData.user.email}_${articleId}`,
          });
        }

        setTimeout(() => setStatus('idle'), 1500);
      } else {
        setStatus('idle');
      }
    } catch {
      setStatus('idle');
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={status !== 'idle'}
      aria-pressed={isCompleted}
      className={`
        group relative inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-all duration-300
        ${isCompleted
          ? 'border-border-interactive bg-surface-dense text-text-secondary'
          : 'border-border-subtle bg-surface-interactive text-text-primary hover:border-border-interactive hover:shadow-lift hover:-translate-y-0.5'
        }
        disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
      `}
    >
      <span className="relative z-10 flex items-center gap-2">
        {status === 'loading' ? (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : status === 'success' || (isCompleted && status === 'idle') ? (
          <svg className={`h-4 w-4 ${status === 'success' ? 'animate-in zoom-in duration-300' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className="w-4 h-4 rounded-full border-2 border-text-muted group-hover:border-text-primary transition-colors" />
        )}

        {status === 'loading' ? 'Saving...' :
          status === 'success' ? 'Completed' :
            isCompleted ? 'Completed' : 'Mark Complete'}
      </span>
    </button>
  );
}
