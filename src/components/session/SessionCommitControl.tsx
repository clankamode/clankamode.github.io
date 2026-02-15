'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { EXECUTION_SURFACE_LAYOUT_CLASS } from './ExecutionSurface';

interface SessionCommitControlProps {
    onComplete?: () => void;
}

export default function SessionCommitControl({
    onComplete
}: SessionCommitControlProps) {
    const { state, advanceItem } = useSessionContext();
    const router = useRouter();
    const [isCommitting, setIsCommitting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const revealOffset = 440;
        const updateVisibility = () => setIsVisible(window.scrollY > revealOffset);

        updateVisibility();
        window.addEventListener('scroll', updateVisibility, { passive: true });
        return () => window.removeEventListener('scroll', updateVisibility);
    }, []);

    if (!state.scope || !state.execution) return null;

    const { items } = state.scope;
    const { currentIndex, sessionId, currentChunk, totalChunks } = state.execution;
    const currentItem = items[currentIndex] ?? null;
    const isLastItem = currentIndex >= items.length - 1;
    const isOnLastChunk = totalChunks <= 1 || currentChunk >= totalChunks - 1;
    const nextItem = !isLastItem ? items[currentIndex + 1] : null;

    if (!isOnLastChunk) {
        return null;
    }

    const handleCommit = async () => {
        if (isCommitting) return;

        setIsCommitting(true);

        if (currentItem?.articleId) {
            try {
                await fetch('/api/progress/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-idempotency-key': `${sessionId}:${currentItem.articleId}:complete`,
                    },
                    body: JSON.stringify({ articleId: currentItem.articleId }),
                });
            } catch { }
        }

        if (onComplete) onComplete();
        advanceItem();
        if (nextItem) {
            router.push(nextItem.href);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsCommitting(false);
    };

    return (
        <div
            className={`sticky bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-6 transition-all duration-300 ${
                isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-5 opacity-0 pointer-events-none'
            }`}
        >
            <div className={`${EXECUTION_SURFACE_LAYOUT_CLASS} flex justify-end`}>
                <button
                    onClick={handleCommit}
                    disabled={isCommitting}
                    className="inline-flex items-center gap-2 rounded-full border border-border-interactive bg-foreground px-5 py-2 text-[14px] font-semibold text-background transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-interactive focus-visible:ring-offset-0 disabled:opacity-70"
                >
                    <span>{isCommitting ? 'Committing...' : isLastItem ? 'Complete session' : 'Complete & continue'}</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
