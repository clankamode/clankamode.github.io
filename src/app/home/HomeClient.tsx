'use client';

import { useSession } from 'next-auth/react';
import type { SessionState } from '@/lib/progress';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import NowCard from './_components/NowCard';
import SessionExitView from './_components/SessionExitView';

interface HomeClientProps {
    sessionState: SessionState | null;
    primer?: {
        label: string;
        relativeTime: string;
    } | null;
}

export default function HomeClient({ sessionState, primer }: HomeClientProps) {
    const { data: authData, status } = useSession();
    const { state: sessionPhaseState } = useSessionContext();

    if (status === 'loading') {
        return (
            <main className="bg-background">
                <div className="min-h-[calc(100vh-var(--nav-height,113px)-96px)] flex items-center justify-center py-16">
                    <div className="animate-pulse text-text-muted">Loading...</div>
                </div>
            </main>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    if (sessionPhaseState.phase === 'exit') {
        return <SessionExitView />;
    }

    if (!sessionState) {
        return (
            <main
                className="bg-background"
                data-chrome-mode="gate"
            >
                <div className="min-h-[calc(100vh-var(--nav-height,113px)-96px)] flex items-center">
                    <div className="max-w-2xl mx-auto px-6 py-16 w-full">
                        <NowCard
                            session={{ mode: 'pick_track', now: null, upNext: [], proof: { streakDays: 0, todayCount: 0, last7: [] }, track: null }}
                            userId={authData?.user?.email ?? undefined}
                            googleId={authData?.user?.id ?? undefined}
                            primer={primer}
                        />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main
            className="bg-background"
            data-chrome-mode="gate"
        >
            <div className="min-h-[calc(100vh-var(--nav-height,113px)-96px)] flex items-center">
                <div className="max-w-2xl mx-auto px-6 py-16 w-full">
                    <NowCard
                        session={sessionState}
                        userId={authData?.user?.email ?? undefined}
                        googleId={authData?.user?.id ?? undefined}
                        primer={primer}
                    />
                </div>
            </div>
        </main>
    );
}
