'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';
import { chunkArticleByHeadings, getChunkByIndex } from '@/lib/article-chunking';
import ArticleRenderer from '@/app/learn/_components/ArticleRenderer';
import { cn } from '@/lib/utils';
import { shouldIgnoreSessionShortcut } from '@/lib/session-shortcuts';

interface ChunkedArticleRendererProps {
    content: string;
    focusedChunkIndex?: number | null;
}

export default function ChunkedArticleRenderer({ content, focusedChunkIndex = null }: ChunkedArticleRendererProps) {
    const router = useRouter();
    const { state, setTotalChunks, nextChunk, prevChunk, advanceItem } = useSession();
    const advanceLockRef = useRef(false);
    const [isCompletingArticle, setIsCompletingArticle] = useState(false);

    const chunks = useMemo(() => chunkArticleByHeadings(content), [content]);
    const focusedChunk = useMemo(() => {
        if (focusedChunkIndex === null || focusedChunkIndex < 0) return null;
        return getChunkByIndex(chunks, focusedChunkIndex);
    }, [chunks, focusedChunkIndex]);
    const renderedChunks = focusedChunk ? [focusedChunk] : chunks;
    const isFocusedMode = !!focusedChunk;
    const isInExecution = state.phase === 'execution' && !!state.execution && !!state.scope;
    const isTransitioning = state.transitionStatus !== 'ready';
    const currentChunkIndex = Math.min(state.execution?.currentChunk ?? 0, Math.max(renderedChunks.length - 1, 0));
    const isLastChunk = currentChunkIndex === renderedChunks.length - 1;

    const handleAdvanceArticle = useCallback(() => {
        if (!isInExecution || !state.execution || !state.scope) return;
        if (advanceLockRef.current) return;
        if (isTransitioning) return;

        advanceLockRef.current = true;
        setIsCompletingArticle(true);

        const nextItem = state.scope.items[state.execution.currentIndex + 1] ?? null;
        if (nextItem) {
            router.prefetch(nextItem.href);
        }

        advanceItem();
        if (nextItem) {
            router.push(nextItem.href);
        }
    }, [isInExecution, isTransitioning, state.execution, state.scope, advanceItem, router]);

    useEffect(() => {
        if (state.phase === 'execution') {
            setTotalChunks(renderedChunks.length);
        }
    }, [renderedChunks.length, state.phase, setTotalChunks]);

    useEffect(() => {
        if (!isInExecution || !state.execution) {
            advanceLockRef.current = false;
            setIsCompletingArticle(false);
            return;
        }

        if (state.execution.currentChunk < renderedChunks.length - 1) {
            advanceLockRef.current = false;
            setIsCompletingArticle(false);
        }
    }, [isInExecution, state.execution, renderedChunks.length]);

    useEffect(() => {
        if (state.phase !== 'execution') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (shouldIgnoreSessionShortcut(e)) {
                return;
            }
            const drawerEl = document.querySelector<HTMLElement>('[data-drawer="toc"]');
            if (drawerEl?.dataset.state === 'open') {
                return;
            }

            if (e.key === 'ArrowLeft' || e.key === 'h') {
                e.preventDefault();
                prevChunk();
            } else if (e.key === 'ArrowRight' || e.key === 'l') {
                e.preventDefault();
                if (state.execution && state.execution.currentChunk >= renderedChunks.length - 1) {
                    handleAdvanceArticle();
                } else {
                    nextChunk();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.phase, state.execution, renderedChunks.length, nextChunk, prevChunk, handleAdvanceArticle]);

    if (state.phase !== 'execution' || !state.execution) {
        return <ArticleRenderer content={content} mode="default" />;
    }

    const currentChunk = getChunkByIndex(renderedChunks, currentChunkIndex);

    if (!currentChunk) {
        return <ArticleRenderer content={content} mode="execution" />;
    }

    const isFirstChunk = currentChunkIndex === 0;

    return (
        <div>
            <div
                data-reading-boundary="section-header"
                className="mb-5 border-t border-border-interactive/35 pt-2"
            >
                <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
                    {currentChunk.title}
                </h2>
            </div>

            <div>
                <ArticleRenderer content={currentChunk.content} mode="execution" />
            </div>

            <div
                data-reading-boundary="step-control"
                className="mt-10 border-t border-border-interactive/35 pt-4"
            >
                <div className="mb-4 space-y-2 lg:hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">
                            Step {currentChunkIndex + 1} of {renderedChunks.length}
                        </span>
                        <span className="text-xs font-mono text-text-muted">
                            {Math.round(((currentChunkIndex + 1) / renderedChunks.length) * 100)}%
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {Array.from({ length: renderedChunks.length }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'h-1.5 flex-1 rounded-full transition-all duration-500 ease-out',
                                    i < currentChunkIndex
                                        ? 'bg-emerald-500/70'
                                        : i === currentChunkIndex
                                            ? 'bg-emerald-600'
                                            : 'bg-border-subtle'
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    {isFirstChunk ? (
                        <div />
                    ) : (
                        <button
                            onClick={prevChunk}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-interactive/35 hover:text-text-primary outline-none focus-visible:ring-1 focus-visible:ring-border-interactive"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>Previous</span>
                            <span className="text-xs text-text-muted">←</span>
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (isLastChunk) {
                                handleAdvanceArticle();
                            } else {
                                nextChunk();
                            }
                        }}
                        disabled={isLastChunk && (isCompletingArticle || isTransitioning)}
                        className="group relative flex items-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-emerald-500 outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <span>
                            {isLastChunk
                                ? isCompletingArticle || isTransitioning
                                    ? 'Saving progress...'
                                    : isFocusedMode
                                        ? 'Complete Section'
                                        : 'Complete Article'
                                : 'Next Section'}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs opacity-70">→</span>
                            {isCompletingArticle ? (
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
