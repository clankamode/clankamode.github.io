'use client';

import { useState } from 'react';
import { logTelemetryEvent } from '@/lib/telemetry';
import { useSession } from 'next-auth/react';
import { ArticleProgressGlyph } from '@/components/ui/LearnGlyphs';

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
          ? 'border-brand-green/55 bg-brand-green/14 text-brand-green hover:border-brand-green/70 hover:bg-brand-green/18'
          : 'border-border-interactive bg-surface-interactive text-text-primary hover:border-border-interactive hover:shadow-lift hover:-translate-y-0.5'
        }
        disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
      `}
    >
      <span className="relative z-10 flex items-center gap-2">
        {status === 'loading' ? (
          <ArticleProgressGlyph state="loading" className="h-[18px] w-[18px] animate-spin" />
        ) : status === 'success' || (isCompleted && status === 'idle') ? (
          <ArticleProgressGlyph
            state="complete"
            className={`h-[18px] w-[18px] ${status === 'success' ? 'animate-in zoom-in duration-300' : ''}`}
          />
        ) : (
          <ArticleProgressGlyph state="idle" className="h-[18px] w-[18px] text-text-muted transition-colors group-hover:text-text-primary" />
        )}

        {status === 'loading' ? 'Saving...' :
          status === 'success' ? 'Completed' :
            isCompleted ? 'Completed' : 'Mark Complete'}
      </span>
    </button>
  );
}
