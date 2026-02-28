'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SessionItem, SessionState } from '@/lib/progress';
import { useSession as useSessionContext, type SessionScope } from '@/contexts/SessionContext';
import { logTelemetryEvent } from '@/lib/telemetry';
import { AI_POLICY_VERSION } from '@/lib/ai-policy/types';


interface NowCardProps {
    session: SessionState;
    userId?: string;
    googleId?: string | null;
    primer?: {
        label: string;
        relativeTime: string;
    } | null;
}

const ONBOARDING_POLICY_CONTEXT_KEY = 'onboarding:policy-context:v1';

function consumeOnboardingPolicyContext(): { decisionId: string | null; fallbackUsed: boolean } | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.sessionStorage.getItem(ONBOARDING_POLICY_CONTEXT_KEY);
        if (!raw) return null;
        window.sessionStorage.removeItem(ONBOARDING_POLICY_CONTEXT_KEY);
        const parsed = JSON.parse(raw) as { decisionId?: unknown; fallbackUsed?: unknown };
        return {
            decisionId: typeof parsed.decisionId === 'string' ? parsed.decisionId : null,
            fallbackUsed: Boolean(parsed.fallbackUsed),
        };
    } catch {
        return null;
    }
}

export default function NowCard({ session, userId, googleId, primer }: NowCardProps) {
    const router = useRouter();
    const { commitSession } = useSessionContext();
    const { mode, now, upNext, track } = session;

    const [isPicking, setIsPicking] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const isFirstTime = mode === 'pick_track' || !now;
    const streakDays = session.proof?.streakDays ?? 0;

    const assertion = isFirstTime ? {
        title: 'Data Structures',
        estMinutes: 5,
        itemCount: 1,
        trackName: 'Foundations',
        action: () => {
            const onboardingPolicy = consumeOnboardingPolicyContext();
            const aiPolicyVersion =
                session.planPolicyDecisionId
                    || session.scopePolicyDecisionId
                    || onboardingPolicy?.decisionId
                    || session.policyFallbackUsed
                    ? AI_POLICY_VERSION
                    : null;
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
                    },
                    primaryConceptSlug: 'array.random-access-o1',
                    targetConcept: 'Array indexing invariants',
                }],
                estimatedMinutes: 5,
                exitCondition: 'Complete item',
                userId,
                googleId: googleId ?? undefined,
                personalization: null,
                personalizationExperiment: null,
                aiPolicyVersion,
                planPolicyDecisionId: session.planPolicyDecisionId ?? null,
                scopePolicyDecisionId: session.scopePolicyDecisionId ?? null,
                onboardingDecisionId: onboardingPolicy?.decisionId ?? null,
                policyFallbackUsed: Boolean(session.policyFallbackUsed || onboardingPolicy?.fallbackUsed),
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
                    primaryConcept: 'array.random-access-o1',
                    itemHref: '/learn/dsa/arrays',
                    personalizationScopeCohort: 'not_eligible',
                    personalizationScopeApplied: false,
                    aiPolicyVersion: scope.aiPolicyVersion,
                    planDecisionId: scope.planPolicyDecisionId,
                    scopeDecisionId: scope.scopePolicyDecisionId,
                    onboardingDecisionId: scope.onboardingDecisionId,
                    policyFallbackUsed: scope.policyFallbackUsed,
                },
                dedupeKey: `committed_${sessionId}`
            });

            commitSession({ ...scope, sessionId });
            router.push('/learn/dsa/arrays');
        },
        targetConcept: 'Array indexing invariants',
    } : {
        title: now!.title,
        estMinutes: now ? [now, ...upNext.slice(0, 2)].reduce((sum, item) => sum + (item.estMinutes || 5), 0) : 0,
        itemCount: now ? 1 + (upNext.length > 2 ? 2 : upNext.length) : 0,
        trackName: track?.name,
        action: () => {
            if (!now || !track) return;
            const onboardingPolicy = consumeOnboardingPolicyContext();
            const aiPolicyVersion =
                session.planPolicyDecisionId
                    || session.scopePolicyDecisionId
                    || onboardingPolicy?.decisionId
                    || session.policyFallbackUsed
                    ? AI_POLICY_VERSION
                    : null;
            const sessionId = crypto.randomUUID();
            const scope: SessionScope = {
                track,
                items: [now, ...upNext.slice(0, 2)],
                estimatedMinutes: [now, ...upNext.slice(0, 2)].reduce((sum, item) => sum + (item.estMinutes || 5), 0),
                exitCondition: 'Complete all items',
                userId,
                googleId: googleId ?? undefined,
                personalization: session.personalization,
                personalizationExperiment: session.personalizationExperiment,
                aiPolicyVersion,
                planPolicyDecisionId: session.planPolicyDecisionId ?? null,
                scopePolicyDecisionId: session.scopePolicyDecisionId ?? null,
                onboardingDecisionId: onboardingPolicy?.decisionId ?? null,
                policyFallbackUsed: Boolean(session.policyFallbackUsed || onboardingPolicy?.fallbackUsed),
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
                    primaryConcept: getCanonicalConceptSlug(now),
                    itemHref: now.href,
                    personalizationScore: session.personalization?.score ?? null,
                    personalizationSegment: session.personalization?.segment ?? null,
                    personalizationRecommendation: session.personalization?.recommendation ?? null,
                    personalizationScopeCohort: session.personalizationExperiment?.cohort ?? 'not_eligible',
                    personalizationScopeEligible: session.personalizationExperiment?.eligible ?? false,
                    personalizationScopeApplied: session.personalizationExperiment?.applied ?? false,
                    personalizationScopeMaxItems: session.personalizationExperiment?.maxItems ?? null,
                    personalizationScopeMaxMinutes: session.personalizationExperiment?.maxMinutes ?? null,
                    aiPolicyVersion: scope.aiPolicyVersion,
                    planDecisionId: scope.planPolicyDecisionId,
                    scopeDecisionId: scope.scopePolicyDecisionId,
                    onboardingDecisionId: scope.onboardingDecisionId,
                    policyFallbackUsed: scope.policyFallbackUsed,
                },
                dedupeKey: `committed_${sessionId}`
            });

            commitSession({ ...scope, sessionId });
            router.push(now.href);
        },
        targetConcept: formatTargetConcept(now?.targetConcept || now?.primaryConceptSlug || null),
    };
    const displayTitle = simplifyGateTitle(assertion.title);

    useEffect(() => {
        if (!userId || !track?.slug) return;
        logTelemetryEvent({
            userId,
            trackSlug: track.slug,
            sessionId: 'gate_browse',
            eventType: 'gate_shown',
            mode: 'gate',
            payload: {
                conceptSlug: getCanonicalConceptSlug(now || null),
                itemHref: now?.href || null,
                sessionMode: session.mode
            },
            dedupeKey: `gate_${userId}_${track.slug}_${getCanonicalConceptSlug(now || null) || now?.href || 'init'}`
        });
    }, [userId, track?.slug, now, session.mode]);

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
                        className="inline-flex min-h-[40px] items-center rounded-xl border border-border-subtle px-4 text-sm font-medium text-text-secondary transition-all hover:border-border-interactive hover:bg-surface-interactive hover:text-text-primary"
                    >
                        Cancel
                    </button>
                </div>

                <div className="space-y-3">
                    {[
                        { slug: 'dsa', label: 'Data Structures & Algorithms', time: '~20 min' },
                        { slug: 'system-design', label: 'System Design', time: '~25 min' },
                        { slug: 'job-hunt', label: 'Job Hunt', time: '~15 min' },
                    ].map((t) => (
                        <button
                            key={t.slug}
                            onClick={() => {
                                setIsPicking(false);
                                router.push(`/home?track=${encodeURIComponent(t.slug)}`);
                            }}
                            className="w-full text-left p-5 rounded-xl border border-border-subtle bg-surface-workbench hover:bg-surface-interactive hover:border-border-interactive transition-all group"
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
            <div className="relative rounded-2xl bg-surface-interactive border border-border-subtle p-8 md:p-10 transition-all duration-500 hover:border-border-interactive hover:shadow-lift">
                <div className="flex flex-col items-start gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                                {assertion.itemCount === 1 && assertion.trackName === 'Foundations' ? 'Recommended Entry' : 'Up Next'}
                            </span>
                            {primer && (
                                <span className="text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                                    <span className="w-1 h-1 rounded-full bg-text-muted" />
                                    Last locked in:{' '}
                                    <Link
                                        href="/learn/progress"
                                        className="text-text-secondary border-b border-text-secondary/30 hover:text-text-primary hover:border-text-primary/40 transition-colors"
                                        title={`Open lock-in history (${primer.relativeTime})`}
                                    >
                                        {primer.label}
                                    </Link>
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-[1.1] tracking-tight text-balance">
                            {displayTitle}
                        </h1>

                        {assertion.targetConcept && (
                            <p className="mt-5 text-base font-medium text-text-primary/80 leading-snug">
                                {assertion.targetConcept}
                            </p>
                        )}

                        <div className="mt-4 flex items-center gap-3 text-xs text-text-secondary">
                            <span>{assertion.itemCount} step{assertion.itemCount !== 1 ? 's' : ''}</span>
                            <span className="text-border-interactive">·</span>
                            <span>{assertion.estMinutes} min</span>
                            {streakDays > 0 && (
                                <>
                                    <span className="text-border-interactive">·</span>
                                    <span className="inline-flex items-center rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                                        {streakDays}d streak
                                    </span>
                                </>
                            )}
                            <span className="text-border-interactive">·</span>
                            <span>{assertion.trackName}</span>
                        </div>
                    </div>

                    <div className="w-full">
                        <button
                            onClick={() => handleStartRef.current()}
                            disabled={isStarting}
                            data-session-cta
                            className="
                                group/btn inline-flex items-center justify-center rounded-xl
                                bg-emerald-600 px-6 py-3 text-sm font-medium text-white
                                transition-all duration-300
                                hover:bg-emerald-500
                                active:scale-[0.98]
                                disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
                                outline-none focus-visible:ring-1 focus-visible:ring-emerald-400
                            "
                        >
                            <span className="flex items-center gap-3">
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
                        </button>
                    </div>

                    <button
                        onClick={() => setIsPicking(true)}
                        className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors py-1"
                    >
                        Change track
                    </button>
                </div>

                <div className="absolute bottom-6 right-8 hidden md:flex items-center gap-1.5 text-[10px] font-mono text-text-muted/50">
                    <span>Press</span>
                    <kbd className="border border-border-subtle px-1.5 py-0.5 rounded text-text-muted">↵</kbd>
                    <span>to start</span>
                </div>
            </div>
        </section>
    );
}

function isInputFocused(): boolean {
    const el = document.activeElement;
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

function formatTargetConcept(value: string | null): string | null {
    if (!value) return null;
    const trailing = value.split('.').pop() || value;
    const label = trailing.replace(/[-_]/g, ' ').trim();
    if (!label) return null;
    return label[0].toUpperCase() + label.slice(1);
}


function simplifyGateTitle(title: string): string {
    const separator = [' · ', ' — ', ' – ', ' | '].find((token) => title.includes(token));
    const simplified = separator ? title.split(separator)[0] : title;
    return simplified.replace(/\s+\?$/, '').trim();
}

function getCanonicalConceptSlug(item: SessionItem | null | undefined): string | null {
    if (!item) return null;

    const primary = item.primaryConceptSlug?.trim();
    if (primary) return primary;

    const slug = item.slug?.trim();
    if (slug && !slug.startsWith('/')) return slug;

    return null;
}
