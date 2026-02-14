'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { sanitizeIntentText } from '@/lib/intent-display';

interface SessionHUDProps {
    onToggleTOC: () => void;
    viewLabel?: string;
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

function formatTargetConcept(value: string | null | undefined): string | null {
    if (!value) return null;
    const trailingSegment = value.split('.').pop() || value;
    const label = trailingSegment.replace(/[-_]/g, ' ').trim();
    if (!label) return null;
    return label[0].toUpperCase() + label.slice(1);
}

export default function SessionHUD({ onToggleTOC, viewLabel = 'View' }: SessionHUDProps) {
    const { state, abandonSession } = useSessionContext();
    const [elapsedTime, setElapsedTime] = useState('0:00');
    const [isWhyOpen, setIsWhyOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

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

    const inExecution = state.phase === 'execution' && !!state.scope && !!state.execution;
    const items = inExecution ? state.scope!.items : [];
    const currentIndex = inExecution ? state.execution!.currentIndex : 0;
    const currentChunk = inExecution ? state.execution!.currentChunk : 0;
    const totalChunks = inExecution ? state.execution!.totalChunks : 0;
    const showChunkProgress = inExecution && totalChunks > 1;
    const currentItem = inExecution ? (items[currentIndex] || null) : null;
    const targetConcept = formatTargetConcept(currentItem?.targetConcept || currentItem?.primaryConceptSlug);
    const intentSummary = sanitizeIntentText(currentItem?.intent?.text, {
        title: currentItem?.title || null,
        maxChars: 140,
        minChars: 24,
    });

    useEffect(() => {
        setIsWhyOpen(false);
    }, [currentItem?.href]);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleOutside = (event: MouseEvent) => {
            const target = event.target;
            if (menuRef.current && target instanceof Node && !menuRef.current.contains(target)) {
                setIsMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('mousedown', handleOutside);
        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('mousedown', handleOutside);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    if (!inExecution) {
        return null;
    }

    const track = state.scope!.track;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-interactive bg-background/90 backdrop-blur-md">
            <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium uppercase tracking-[0.15em] text-accent-primary">
                        Session
                    </span>
                    <span className="text-text-secondary">·</span>
                    <span className="text-sm text-text-primary">
                        {track.name}
                    </span>
                    <span className="text-text-secondary">·</span>
                    <span className="text-sm font-mono text-text-primary/90" title="Elapsed time">
                        {elapsedTime}
                    </span>
                    {showChunkProgress && (
                        <span
                            className="rounded-full border border-border-interactive bg-surface-interactive px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary"
                            title={`Section ${currentChunk + 1} of ${totalChunks}`}
                        >
                            Section {currentChunk + 1}/{totalChunks}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {items.map((item, i) => (
                        <div
                            key={item.href}
                            className={`h-2 w-2 rounded-full transition-colors ${i < currentIndex
                                ? 'bg-accent-primary'
                                : i === currentIndex
                                    ? 'bg-text-primary'
                                    : 'bg-border-interactive'
                                }`}
                            title={item.title}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            onToggleTOC();
                            setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                        title={`${viewLabel} options (T)`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
                        </svg>
                        <span className="hidden sm:inline">{viewLabel}</span>
                    </button>

                    <div className="h-4 w-px bg-border-subtle" />

                    <div ref={menuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen((prev) => !prev)}
                            className="inline-flex items-center rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-interactive hover:text-text-primary"
                            aria-haspopup="menu"
                            aria-expanded={isMenuOpen}
                            title="Session actions"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <circle cx="5" cy="12" r="1.75" />
                                <circle cx="12" cy="12" r="1.75" />
                                <circle cx="19" cy="12" r="1.75" />
                            </svg>
                        </button>

                        {isMenuOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 mt-2 w-44 rounded-lg border border-border-subtle bg-surface-ambient p-1 shadow-lift"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        abandonSession();
                                    }}
                                    className="w-full rounded-md px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-interactive hover:text-red-400"
                                    role="menuitem"
                                >
                                    Leave session
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {currentItem && (
                <div className="max-w-screen-xl mx-auto px-6 pb-2">
                    {isWhyOpen ? (
                        <div className="rounded-lg border border-border-subtle bg-surface-interactive/70 px-3 py-2">
                            <button
                                type="button"
                                onClick={() => setIsWhyOpen(false)}
                                className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                Why this next
                                <span className="normal-case tracking-normal text-text-secondary">Hide</span>
                            </button>
                            <p className="mt-2 text-sm text-text-primary/85">
                                {intentSummary}
                            </p>
                            {targetConcept && (
                                <p className="mt-1.5 text-xs text-text-muted">
                                    <span className="font-semibold text-text-secondary">Target:</span> {targetConcept}
                                </p>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsWhyOpen(true)}
                            className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-interactive/60 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-text-muted transition-colors hover:border-border-interactive hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            aria-expanded={isWhyOpen}
                        >
                            Why this next
                            <span className="normal-case tracking-normal text-text-secondary">Show</span>
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5 10 12.5l5-5" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </header>
    );
}
