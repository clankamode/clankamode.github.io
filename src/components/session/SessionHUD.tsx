'use client';

import { useSession as useSessionContext } from '@/contexts/SessionContext';

interface SessionHUDProps {
    onToggleTOC: () => void;
}

export default function SessionHUD({ onToggleTOC }: SessionHUDProps) {
    const { state, abandonSession } = useSessionContext();

    if (state.phase !== 'execution' || !state.scope || !state.execution) {
        return null;
    }

    const { track, items } = state.scope;
    const { currentIndex } = state.execution;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/[0.05]">
            <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-[0.15em] text-accent-primary">
                        Session
                    </span>
                    <span className="text-text-muted">·</span>
                    <span className="text-sm text-text-secondary">
                        {track.name}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {items.map((item, i) => (
                        <div
                            key={item.href}
                            className={`w-2 h-2 rounded-full transition-colors ${i < currentIndex
                                ? 'bg-accent-primary'
                                : i === currentIndex
                                    ? 'bg-white'
                                    : 'bg-white/20'
                                }`}
                            title={item.title}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={onToggleTOC}
                        className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
                        title="On this page (T)"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                        <span className="hidden sm:inline">Page</span>
                    </button>

                    <button
                        onClick={abandonSession}
                        className="text-sm text-text-muted hover:text-red-400 transition-colors"
                    >
                        Leave session
                    </button>
                </div>
            </div>
        </header>
    );
}
