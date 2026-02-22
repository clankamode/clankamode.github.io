'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { shouldIgnoreSessionShortcut } from '@/lib/session-shortcuts';
import SessionHUD from './SessionHUD';
import ExecutionSurface from './ExecutionSurface';
import SessionRail from './SessionRail';
import SessionChecklist from './SessionChecklist';

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
    const { recordDrawerToggle } = useSession();
    const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

    useEffect(() => {
        setRightDrawerOpen(false);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (shouldIgnoreSessionShortcut(e)) {
                return;
            }

            if (e.key.toLowerCase() === 't') {
                if (e.repeat) return;
                e.preventDefault();
                setRightDrawerOpen(prev => !prev);
                recordDrawerToggle();
            }
            if (e.key === 'Escape') {
                setRightDrawerOpen((prev) => {
                    if (prev) {
                        recordDrawerToggle();
                    }
                    return false;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [recordDrawerToggle]);

    useEffect(() => {
        document.body.style.overflow = rightDrawerOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [rightDrawerOpen]);

    const toggleDrawer = () => {
        setRightDrawerOpen((prev) => !prev);
        recordDrawerToggle();
    };

    const closeDrawer = () => {
        setRightDrawerOpen((prev) => {
            if (prev) {
                recordDrawerToggle();
            }
            return false;
        });
    };

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <SessionHUD
                onToggleTOC={toggleDrawer}
                viewLabel={viewLabel}
                isViewOpen={rightDrawerOpen}
            />

            <main className={cn(
                "pt-16 pb-20 transition-transform duration-300 ease-in-out",
                rightDrawerOpen && "lg:-translate-x-64"
            )}>
                <ExecutionSurface rail={<SessionRail />}>
                    {children}
                </ExecutionSurface>
            </main>


            <aside
                id="session-view-drawer"
                data-drawer="toc"
                data-state={rightDrawerOpen ? 'open' : 'closed'}
                className={cn(
                    "fixed top-0 right-0 bottom-0 z-40 w-full sm:w-80 border-l border-border-subtle bg-surface-ambient transform transition-transform duration-300 ease-in-out pt-24 px-6 overflow-y-auto",
                    rightDrawerOpen ? "translate-x-0" : "translate-x-full"
                )}
                role="complementary"
                aria-label={`${viewLabel} options`}
            >
                <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                        {viewLabel} options (T)
                    </span>
                    <button
                        onClick={closeDrawer}
                        className="text-text-muted hover:text-text-primary"
                        aria-label="Close options"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-8">
                    <section className="space-y-4">
                        <SessionChecklist />
                    </section>
                    <section className="space-y-3">
                        {tableOfContents}
                    </section>
                </div>
            </aside>

            {rightDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity"
                    onClick={closeDrawer}
                />
            )}
        </div>
    );
}
