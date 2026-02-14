'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';
import { chunkArticleByHeadings, getChunkByIndex } from '@/lib/article-chunking';
import ArticleRenderer from '@/app/learn/_components/ArticleRenderer';

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
    const currentChunkIndex = Math.min(state.execution?.currentChunk ?? 0, Math.max(renderedChunks.length - 1, 0));
    const isLastChunk = currentChunkIndex === renderedChunks.length - 1;

    const handleAdvanceArticle = useCallback(() => {
        if (!isInExecution || !state.execution || !state.scope) return;
        if (advanceLockRef.current) return;

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
    }, [isInExecution, state.execution, state.scope, advanceItem, router]);

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
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
        return <ArticleRenderer content={content} />;
    }

    const currentChunk = getChunkByIndex(renderedChunks, currentChunkIndex);

    if (!currentChunk) {
        return <ArticleRenderer content={content} />;
    }

    const isFirstChunk = currentChunkIndex === 0;

    return (
        <div>
            <div className="mb-6 border-b border-border-interactive pb-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-text-secondary">
                    <span>
                        {isFocusedMode
                            ? `Section ${(focusedChunk?.index ?? 0) + 1} of ${chunks.length}`
                            : `Section ${currentChunkIndex + 1} of ${chunks.length}`}
                    </span>
                    <span>·</span>
                    <span>{currentChunk.title}</span>
                </div>
            </div>

            <div className="[&_p]:text-text-primary/85 [&_li]:text-text-primary/80 [&_blockquote]:text-text-primary/80">
                <ArticleRenderer content={currentChunk.content} />
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-border-interactive pt-8">
                {isFirstChunk ? (
                    <p className="px-4 py-2.5 text-sm text-text-secondary">
                        {isFocusedMode ? 'Current section' : 'Start of article'}
                    </p>
                ) : (
                    <button
                        onClick={prevChunk}
                        className="flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-border-interactive hover:bg-surface-interactive"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Previous section</span>
                        <span className="text-xs text-text-secondary">← or H</span>
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
                    disabled={isLastChunk && isCompletingArticle}
                    className="flex items-center gap-2 rounded-lg border border-accent-primary/35 bg-accent-primary/12 px-4 py-2.5 text-sm font-semibold text-accent-primary transition-colors hover:bg-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <span>
                        {isLastChunk
                            ? (isCompletingArticle ? 'Completing...' : (isFocusedMode ? 'Mark section complete' : 'Mark complete'))
                            : 'Next section'}
                    </span>
                    <span className="hidden sm:inline text-xs text-accent-primary/70">→ or L</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
