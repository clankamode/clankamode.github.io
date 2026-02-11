'use client';

import { useState } from 'react';
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

    if (!state.scope || !state.execution) return null;

    const { items } = state.scope;
    const { currentIndex } = state.execution;
    const currentItem = items[currentIndex] ?? null;
    const isLastItem = currentIndex >= items.length - 1;
    const nextItem = !isLastItem ? items[currentIndex + 1] : null;

    const handleCommit = async () => {
        if (isCommitting) return;

        setIsCommitting(true);
        await new Promise(resolve => setTimeout(resolve, 600));

        if (currentItem?.articleId) {
            try {
                await fetch('/api/progress/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ articleId: currentItem.articleId }),
                });
            } catch {}
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
        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-12 pb-12 z-20 flex flex-col items-center justify-center pointer-events-none">
            <div className={`mb-4 text-xs font-medium text-text-muted transition-opacity duration-300 ${isCommitting ? 'opacity-0' : 'opacity-100'}`}>
                <span className="uppercase tracking-wider">Step {currentIndex + 1} of {items.length}</span>
                {nextItem && (
                    <>
                        <span className="mx-2">·</span>
                        <span className="text-text-secondary">Next: {nextItem.title}</span>
                        <span className="ml-1 opacity-50">({nextItem.estMinutes || 5}m)</span>
                    </>
                )}
            </div>

            <button
                onClick={handleCommit}
                disabled={isCommitting}
                className="pointer-events-auto group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-foreground text-background font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-100 disabled:scale-100"
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
