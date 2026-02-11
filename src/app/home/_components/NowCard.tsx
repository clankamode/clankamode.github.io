'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionState } from '@/lib/progress';
import { useSession as useSessionContext, type SessionScope } from '@/contexts/SessionContext';
import { logTelemetryEvent } from '@/lib/telemetry';

interface NowCardProps {
    session: SessionState;
    userId?: string;
    googleId?: string | null;
}

export default function NowCard({ session, userId, googleId }: NowCardProps) {
    const router = useRouter();
    const { commitSession } = useSessionContext();
    const { mode, now, upNext, track } = session;

    const [isPicking, setIsPicking] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const isFirstTime = mode === 'pick_track' || !now;

    const assertion = isFirstTime ? {
        title: 'Data Structures',
        subtitle: 'Recommended starting point',
        estMinutes: 5,
        itemCount: 1,
        trackName: 'Foundations',
        action: () => {
            const sessionId = crypto.randomUUID();
            const scope: SessionScope = {
                track: { slug: 'dsa', name: 'Data Structures' },
                items: [{
                    type: 'learn',
                    title: 'Arrays',
                    subtitle: '5 min read',
                    pillarSlug: 'dsa',
                    href: '/learn/dsa/arrays',
                    estMinutes: 5,
                    intent: {
                        type: 'foundation',
                        text: 'Master the O(1) access pattern that underlies all contiguous memory structures.'
                    }
                }],
                estimatedMinutes: 5,
                exitCondition: 'Complete item',
                userId,
                googleId: googleId ?? undefined,
            };

            logTelemetryEvent({
                userId,
                trackSlug: 'dsa',
                sessionId,
                eventType: 'session_committed',
                mode: 'gate',
                payload: {
                    itemCount: 1,
                    estMinutes: 5,
                    primaryConcept: 'arrays'
                },
                dedupeKey: `committed_${sessionId}`
            });

            commitSession({ ...scope, sessionId });
            router.push('/learn/dsa/arrays');
        },
        reason: 'Master the O(1) access pattern that underlies all contiguous memory structures.'
    } : {
        title: now!.title,
        subtitle: track?.name,
        estMinutes: now ? [now, ...upNext.slice(0, 2)].reduce((sum, item) => sum + (item.estMinutes || 5), 0) : 0,
        itemCount: now ? 1 + (upNext.length > 2 ? 2 : upNext.length) : 0,
        trackName: track?.name,
        action: () => {
            if (!now || !track) return;
            const sessionId = crypto.randomUUID();
            const scope: SessionScope = {
                track,
                items: [now, ...upNext.slice(0, 2)],
                estimatedMinutes: [now, ...upNext.slice(0, 2)].reduce((sum, item) => sum + (item.estMinutes || 5), 0),
                exitCondition: 'Complete all items',
                userId,
                googleId: googleId ?? undefined,
            };

            logTelemetryEvent({
                userId,
                trackSlug: track.slug,
                sessionId,
                eventType: 'session_committed',
                mode: 'gate',
                payload: {
                    itemCount: scope.items.length,
                    estMinutes: scope.estimatedMinutes,
                    primaryConcept: now.slug || now.href
                },
                dedupeKey: `committed_${sessionId}`
            });

            commitSession({ ...scope, sessionId });
            router.push(now.href);
        },
        reason: now!.intent?.text || 'Next step in your learning path.'
    };

    useEffect(() => {
        if (!userId || !track?.slug) return;
        logTelemetryEvent({
            userId,
            trackSlug: track.slug,
            sessionId: 'gate_browse',
            eventType: 'gate_shown',
            mode: 'gate',
            payload: {
                conceptSlug: now?.slug || now?.href,
                sessionMode: session.mode
            },
            dedupeKey: `gate_${userId}_${track.slug}_${now?.slug || now?.href || 'init'}`
        });
    }, [userId, track?.slug, now?.slug, now?.href, session.mode]);

    const handleStartRef = useRef<() => void>(() => undefined);
    useEffect(() => {
        handleStartRef.current = () => {
            if (isStarting) return;
            setIsStarting(true);
            assertion.action();
        };
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.repeat && !isInputFocused() && !isPicking) {
                handleStartRef.current();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPicking]);

    if (isPicking) {
        return (
            <section className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-text-primary">
                        Select a track
                    </h1>
                    <button
                        onClick={() => setIsPicking(false)}
                        className="text-sm text-text-muted hover:text-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                <div className="space-y-3">
                    {[
                        { slug: 'dsa', label: 'Data Structures & Algorithms', time: '~20 min' },
                        { slug: 'system-design', label: 'System Design', time: '~25 min' },
                        { slug: 'interviews', label: 'Interview Prep', time: '~15 min' },
                    ].map((t) => (
                        <button
                            key={t.slug}
                            onClick={() => {
                                setIsPicking(false);
                                router.push(`/home?track=${t.slug}`);
                                router.refresh();
                            }}
                            className="w-full text-left p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-text-primary group-hover:text-accent-primary transition-colors">{t.label}</span>
                                <span className="text-sm text-text-muted">{t.time}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="relative">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight tracking-tight">
                {assertion.title}
            </h1>

            <h3 className="mt-4 text-lg md:text-xl font-medium text-text-secondary leading-relaxed max-w-lg">
                {assertion.reason}
            </h3>

            <div className="mt-6 flex items-center gap-4 text-sm text-text-muted">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60" />
                    {assertion.estMinutes} min
                </span>
                <span>·</span>
                <span>{assertion.trackName}</span>
                {isFirstTime && (
                    <span className="px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary text-[10px] uppercase tracking-wider font-bold">
                        Recommended
                    </span>
                )}
            </div>

            <div className="mt-10 flex flex-col items-start gap-4">
                <button
                    onClick={() => handleStartRef.current()}
                    disabled={isStarting}
                    data-session-cta
                    className="inline-flex items-center justify-center rounded-full bg-white px-12 py-5 text-lg font-bold text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition-all hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-background"
                >
                    Start session
                </button>

                <button
                    onClick={() => setIsPicking(true)}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors px-4 py-2 -ml-4"
                >
                    Change track...
                </button>
            </div>

            <p className="mt-8 text-sm text-text-muted">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-xs">Enter</kbd> to start
            </p>
        </section>
    );
}

function isInputFocused(): boolean {
    const el = document.activeElement;
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

