'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import SessionHUD from './SessionHUD';
import ExecutionSurface from './ExecutionSurface';
import SessionRail from './SessionRail';

interface SessionReaderShellProps {
    children: React.ReactNode;
    tableOfContents: React.ReactNode;
    viewLabel?: string;
}

export default function SessionReaderShell({
    children,
    tableOfContents,
    viewLabel = 'View',
}: SessionReaderShellProps) {
    const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

    useEffect(() => {
        setRightDrawerOpen(false);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key.toLowerCase() === 't') {
                setRightDrawerOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setRightDrawerOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <SessionHUD
                onToggleTOC={() => setRightDrawerOpen(prev => !prev)}
                viewLabel={viewLabel}
            />

            <main className={cn(
                "pt-16 pb-20 transition-transform duration-300 ease-in-out",
                rightDrawerOpen && "-translate-x-64"
            )}>
                <ExecutionSurface rail={<SessionRail onToggleDetails={() => setRightDrawerOpen(prev => !prev)} />}>
                    {children}
                </ExecutionSurface>
            </main>


            <aside
                data-drawer="toc"
                className={cn(
                    "fixed top-0 right-0 bottom-0 z-40 w-80 border-l border-border-subtle bg-surface-ambient transform transition-transform duration-300 ease-in-out pt-24 px-6 overflow-y-auto",
                    rightDrawerOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                        {viewLabel} options (T)
                    </span>
                    <button
                        onClick={() => setRightDrawerOpen(false)}
                        className="text-text-muted hover:text-text-primary"
                    >
                        ✕
                    </button>
                </div>
                {tableOfContents}
            </aside>

            {rightDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity"
                    onClick={() => setRightDrawerOpen(false)}
                />
            )}
        </div>
    );
}
