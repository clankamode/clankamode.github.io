'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { sanitizeIntentText } from '@/lib/intent-display';
import { useRouter } from 'next/navigation';
import { EXECUTION_SURFACE_LAYOUT_CLASS } from './ExecutionSurface';

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

export default function SessionHUD({ onToggleTOC, viewLabel = 'View' }: SessionHUDProps) {
    const { state, abandonSession } = useSessionContext();
    const router = useRouter();
    const [elapsedTime, setElapsedTime] = useState('0:00');
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
    const currentItem = inExecution ? (items[currentIndex] || null) : null;
    const intentSummary = sanitizeIntentText(currentItem?.intent?.text, {
        title: currentItem?.title || null,
        maxChars: 68,
        minChars: 24,
    });

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
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-interactive/28 bg-background/92">
            <div className={`${EXECUTION_SURFACE_LAYOUT_CLASS} py-1.5`}>
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 font-mono text-[11px] tracking-[0.03em] text-text-muted">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <span className="text-[12px] uppercase text-text-primary/95">Session {track.name}</span>
                        <span className="text-text-secondary">{elapsedTime}</span>
                    </div>

                    {currentItem ? (
                        <p className="min-w-0 truncate normal-case tracking-normal text-text-secondary/90">
                            <span className="text-[10px] uppercase tracking-[0.05em] text-text-muted">Why next:</span>{' '}
                            <span>{intentSummary}</span>
                        </p>
                    ) : (
                        <div />
                    )}

                    <div className="justify-self-end flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                onToggleTOC();
                                setIsMenuOpen(false);
                            }}
                            className="inline-flex items-center gap-1 border border-transparent px-1 py-0.5 text-[11px] text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-interactive focus-visible:ring-offset-0"
                            title={`${viewLabel} options (T)`}
                        >
                            <span>{viewLabel}</span>
                            <span className="text-text-muted">[T]</span>
                        </button>

                        <div ref={menuRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                className="inline-flex items-center p-0.5 text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-interactive focus-visible:ring-offset-0"
                                aria-haspopup="menu"
                                aria-expanded={isMenuOpen}
                                title="Session actions"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <circle cx="5" cy="12" r="1.5" />
                                    <circle cx="12" cy="12" r="1.5" />
                                    <circle cx="19" cy="12" r="1.5" />
                                </svg>
                            </button>

                            {isMenuOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-44 border border-border-subtle/60 bg-surface-ambient p-1 shadow-lift"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            abandonSession();
                                            router.replace('/home');
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-interactive/60 hover:text-text-primary"
                                        role="menuitem"
                                    >
                                        Leave session
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
