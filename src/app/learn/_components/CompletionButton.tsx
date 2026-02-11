'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession as useSessionContext } from '@/contexts/SessionContext';

interface CompletionButtonProps {
  articleId: string;
  initialCompleted?: boolean;
}

export default function CompletionButton({
  articleId,
  initialCompleted = false,
}: CompletionButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { state: sessionState, advanceItem } = useSessionContext();

  const isInSession = sessionState.phase === 'execution';

  const handleToggle = async () => {
    if (isSaving) {
      return;
    }

    const nextState = !isCompleted;
    setIsCompleted(nextState);
    setIsSaving(true);

    try {
      const response = await fetch('/api/progress/complete', {
        method: nextState ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      });

      if (response.ok) {
        if (isInSession) {
          const nextIndex = (sessionState.execution?.currentIndex ?? 0) + 1;
          const nextItem = sessionState.scope?.items[nextIndex];

          advanceItem();

          if (nextItem) {
            router.push(nextItem.href);
          } else {
          }
        }
      } else {
        setIsCompleted(!nextState);
      }
    } catch {
      setIsCompleted(!nextState);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isCompleted}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${isCompleted
          ? 'border-brand-green bg-brand-green text-black'
          : 'border-border-subtle bg-surface-interactive text-text-primary hover:border-border-interactive'
        } ${isSaving ? 'opacity-70' : ''}`}
    >
      {isCompleted ? (
        <>
          <span className="text-base">✓</span>
          Completed
        </>
      ) : (
        'Mark as complete'
      )}
    </button>
  );
}
