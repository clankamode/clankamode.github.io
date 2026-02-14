'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession as useSessionContext } from '@/contexts/SessionContext';

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
        const revealOffset = 320;
        const updateVisibility = () => setIsVisible(window.scrollY > revealOffset);

        updateVisibility();
        window.addEventListener('scroll', updateVisibility, { passive: true });
        return () => window.removeEventListener('scroll', updateVisibility);
    }, []);

    if (!state.scope || !state.execution) return null;

    const { items } = state.scope;
    const { currentIndex, sessionId } = state.execution;
    const currentItem = items[currentIndex] ?? null;
    const isLastItem = currentIndex >= items.length - 1;
    const nextItem = !isLastItem ? items[currentIndex + 1] : null;

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
            className={`sticky bottom-0 left-0 right-0 z-20 flex flex-col items-center justify-center bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-9 transition-all duration-300 ${
                isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-5 opacity-0 pointer-events-none'
            }`}
        >
            <button
                onClick={handleCommit}
                disabled={isCommitting}
                className="group relative inline-flex items-center gap-3 rounded-full border border-border-interactive bg-foreground px-7 py-3 text-[15px] font-semibold text-background shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.015] active:scale-[0.985] disabled:opacity-100 disabled:scale-100"
            >
                {isCommitting ? (
                    <>
                        <span className="inline-block w-4 h-4 text-brand-green">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </span>
                        <span>Logged</span>
                    </>
                ) : (
                    <>
                        <span>{isLastItem ? 'Complete session' : 'Complete & continue'}</span>
                        <svg
                            className="w-4 h-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </>
                )}
            </button>
        </div>
    );
}
