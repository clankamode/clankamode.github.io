'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { SessionState } from '@/lib/progress';
import { useSession as useSessionContext } from '@/contexts/SessionContext';
import NowCard from './_components/NowCard';
import SessionExitView from './_components/SessionExitView';
import { logTelemetryEvent } from '@/lib/telemetry';
import { EXECUTION_SURFACE_MAX_WIDTH_CLASS } from '@/components/session/ExecutionSurface';

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
                personalizationScopeCohort: sessionState?.personalizationExperiment?.cohort ?? 'not_eligible',
                personalizationScopeApplied: sessionState?.personalizationExperiment?.applied ?? false,
            },
            dedupeKey: `home_card_${authData.user.email}_${trackSlug}_${nextItemId}`,
        });
    }, [authData?.user?.email, sessionState?.track?.slug, sessionState?.mode, nextItemId, sessionState?.personalizationExperiment?.applied, sessionState?.personalizationExperiment?.cohort]);

    useEffect(() => {
        if (!authData?.user?.email || !sessionState?.personalization || !sessionState?.track?.slug) return;
        const scoreBucket = Math.round(sessionState.personalization.score * 10) / 10;
        const dayKey = new Date().toISOString().slice(0, 10);

        logTelemetryEvent({
            userId: authData.user.email,
            trackSlug: sessionState.track.slug,
            sessionId: 'home_gate',
            eventType: 'personalization_profile_scored',
            mode: 'gate',
            payload: {
                score: sessionState.personalization.score,
                segment: sessionState.personalization.segment,
                recommendation: sessionState.personalization.recommendation,
                committedSessionCount: sessionState.personalization.committedSessionCount,
                onboardingBiasActive: sessionState.personalization.onboardingBiasActive,
                goal: sessionState.personalization.goal,
                selectedTrackSlug: sessionState.personalization.selectedTrackSlug,
                expectedTrackSlug: sessionState.personalization.expectedTrackSlug,
                signals: sessionState.personalization.signals,
                reasons: sessionState.personalization.reasons.slice(0, 3),
                scopeExperiment: sessionState.personalizationExperiment
                    ? {
                        cohort: sessionState.personalizationExperiment.cohort,
                        eligible: sessionState.personalizationExperiment.eligible,
                        applied: sessionState.personalizationExperiment.applied,
                        maxItems: sessionState.personalizationExperiment.maxItems,
                        maxMinutes: sessionState.personalizationExperiment.maxMinutes,
                    }
                    : null,
            },
            dedupeKey: `personalization_profile_${authData.user.email}_${sessionState.track.slug}_${dayKey}_${scoreBucket}_${sessionState.personalization.segment}`,
        });
    }, [authData?.user?.email, sessionState?.personalization, sessionState?.personalizationExperiment, sessionState?.track?.slug]);

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
        return null;
    }

    if (!sessionState) {
        return (
            <main
                className="bg-background"
                data-chrome-mode="gate"
            >
                <div className="min-h-[calc(100vh-var(--nav-height,113px)-96px)] flex items-center">
                    <div className={`${EXECUTION_SURFACE_MAX_WIDTH_CLASS} mx-auto px-5 sm:px-6 py-16 w-full`}>
                        <NowCard
                            session={{
                                mode: 'pick_track',
                                now: null,
                                upNext: [],
                                proof: { streakDays: 0, todayCount: 0, last7: [] },
                                track: null,
                                personalization: null,
                                personalizationExperiment: null
                            }}
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
                <div className={`${EXECUTION_SURFACE_MAX_WIDTH_CLASS} mx-auto px-5 sm:px-6 py-16 w-full`}>
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
