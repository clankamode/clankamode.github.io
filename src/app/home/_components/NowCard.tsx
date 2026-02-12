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
    primer?: {
        label: string;
        relativeTime: string;
    } | null;
}

export default function NowCard({ session, userId, googleId, primer }: NowCardProps) {
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
        <section className="relative group perspective-1000">
            <div className="relative overflow-hidden rounded-3xl bg-surface-interactive border border-border-subtle p-8 md:p-10 transition-all duration-500 hover:border-border-interactive hover:shadow-lift">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-start gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-flex items-center rounded-full bg-accent-primary/10 px-3 py-1 text-xs font-bold text-accent-primary ring-1 ring-inset ring-accent-primary/20 tracking-wider uppercase">
                                {assertion.itemCount === 1 && assertion.trackName === 'Foundations' ? 'Recommended Entry' : 'Up Next'}
                            </span>
                            {primer && (
                                <span className="text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                                    <span className="w-1 h-1 rounded-full bg-text-muted" />
                                    Last locked in: <span className="text-text-secondary border-b border-text-secondary/20">{primer.label}</span>
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-[1.1] tracking-tight text-balance">
                            {assertion.title}
                        </h1>

                        <h3 className="mt-4 text-lg md:text-xl font-medium text-text-secondary leading-relaxed max-w-lg text-balance">
                            {assertion.reason}
                        </h3>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-medium text-text-muted mt-2">
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-dense border border-border-subtle">
                            <span className="w-1.5 h-1.5 rounded-full bg-text-secondary" />
                            {assertion.estMinutes} min
                        </span>
                        <span>{assertion.trackName}</span>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
                        <button
                            onClick={() => handleStartRef.current()}
                            disabled={isStarting}
                            data-session-cta
                            className="
                                relative overflow-hidden group/btn inline-flex items-center justify-center rounded-full 
                                bg-text-primary px-10 py-5 text-lg font-bold text-surface-ambient tracking-wide
                                shadow-[0_4px_20px_rgba(0,0,0,0.1)] 
                                transition-all duration-300 
                                hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:bg-text-primary/95
                                active:scale-[0.98] active:translate-y-0.5
                                disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
                                focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-4 focus:ring-offset-surface-interactive
                            "
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                {isStarting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Initiating...
                                    </>
                                ) : (
                                    <>
                                        Start Session
                                        <svg className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        </button>

                        <button
                            onClick={() => setIsPicking(true)}
                            className="text-sm font-semibold text-text-muted hover:text-text-primary transition-colors py-2 border-b border-transparent hover:border-text-primary/20"
                        >
                            Change track...
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-6 right-8 text-[10px] font-mono text-text-muted opacity-40">
                    PRESS <span className="border border-border-muted px-1 rounded mx-1">↵</span> TO START
                </div>
            </div>
        </section>
    );
}

function isInputFocused(): boolean {
    const el = document.activeElement;
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

