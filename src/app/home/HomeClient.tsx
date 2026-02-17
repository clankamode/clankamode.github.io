'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { SessionState } from '@/lib/progress';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import NowCard from './_components/NowCard';
import SessionExitView from './_components/SessionExitView';
import { logTelemetryEvent } from '@/lib/telemetry';

interface HomeClientProps {
    sessionState: SessionState | null;
    primer?: {
        label: string;
        relativeTime: string;
    } | null;
}

export default function HomeClient({ sessionState, primer }: HomeClientProps) {
    const { data: authData, status } = useSession();
    const { state: sessionPhaseState, resetToEntry } = useSessionContext();
    const nextItemId = sessionState?.now?.practiceQuestionId || sessionState?.now?.articleId || sessionState?.now?.href || 'pick_track';

    useEffect(() => {
        if (sessionPhaseState.phase === 'generating' && sessionState) {
            resetToEntry();
        }
    }, [sessionState, sessionPhaseState.phase, resetToEntry]);

    useEffect(() => {
        if (!authData?.user?.email) return;
        const trackSlug = sessionState?.track?.slug || 'dsa';
        logTelemetryEvent({
            userId: authData.user.email,
            trackSlug,
            sessionId: 'home_gate',
            eventType: 'home_card_rendered',
            mode: 'gate',
            payload: {
                mode: sessionState?.mode || 'pick_track',
                nextItemId,
            },
            dedupeKey: `home_card_${authData.user.email}_${trackSlug}_${nextItemId}`,
        });
    }, [authData?.user?.email, sessionState?.track?.slug, sessionState?.mode, nextItemId]);

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

    if (sessionPhaseState.phase === 'generating') {
        return (
            <main className="bg-background">
                <div className="min-h-[calc(100vh-var(--nav-height,113px)-96px)] flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text-primary"></div>
                        <p className="text-text-secondary text-sm font-medium animate-pulse">
                            Generating your next session...
                        </p>
                    </div>
                </div>
            </main>
        );
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
