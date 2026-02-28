'use client';

import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { useRouter } from 'next/navigation';
import type { SessionItem } from '@/lib/progress';
import { useState, useEffect, useMemo, useRef } from 'react';
import { logTelemetryEvent } from '@/lib/telemetry';
import { AnimatePresence, motion } from 'framer-motion';
import { proposeRitualChoices, type IntentType } from '@/lib/ritual_prompts';
import Link from 'next/link';
import { EXECUTION_SURFACE_LAYOUT_CLASS } from '@/components/session/ExecutionSurface';

const formatConceptLabel = (slug: string | null) => {
    if (!slug) return 'Concept';
    if (slug.includes(' ')) return slug;

    const parts = slug.split('.');
    const distinct = parts[parts.length - 1];
    if (!distinct) return slug;

    return distinct
        .split(/[-_]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

export default function SessionExitView() {
    const { state, commitSession, setGenerating } = useSessionContext();
    const router = useRouter();
    const [finalizeStatus, setFinalizeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [finalizeError, setFinalizeError] = useState<string | null>(null);
    const [hasFinalized, setHasFinalized] = useState(false);
    const hasFinalizedRef = useRef(false);
    const finalizeInFlightRef = useRef<Promise<boolean> | null>(null);

    const [ritualStatus, setRitualStatus] = useState<'pending' | 'completed' | 'skipped'>('pending');

    useEffect(() => {
        hasFinalizedRef.current = hasFinalized;
    }, [hasFinalized]);

    const finalizePayload = useMemo(() => {
        const sessionId = state.scope?.sessionId || 'unknown';
        const trackSlug = state.scope?.track?.slug || 'dsa';
        const completedItems = state.scope?.items?.slice(0, state.exit?.completedCount || 0).map((item) => item.href) || [];
        const skipped = ritualStatus === 'skipped';

        return {
            sessionId,
            trackSlug,
            completedItems,
            reflectionCompletedAt: skipped ? null : new Date().toISOString(),
            skipped,
            personalizationScopeCohort: state.scope?.personalizationExperiment?.cohort ?? 'not_eligible',
            personalizationScopeEligible: state.scope?.personalizationExperiment?.eligible ?? false,
            personalizationScopeApplied: state.scope?.personalizationExperiment?.applied ?? false,
            aiPolicyVersion: state.scope?.aiPolicyVersion ?? null,
            planDecisionId: state.scope?.planPolicyDecisionId ?? null,
            scopeDecisionId: state.scope?.scopePolicyDecisionId ?? null,
            onboardingDecisionId: state.scope?.onboardingDecisionId ?? null,
            policyFallbackUsed: state.scope?.policyFallbackUsed ?? false,
        };
    }, [state.scope, state.exit?.completedCount, ritualStatus]);

    const sendFinalizeBeacon = (payload: {
        sessionId: string;
        trackSlug: string;
        completedItems: string[];
        reflectionCompletedAt: string | null;
        skipped: boolean;
        personalizationScopeCohort: string;
        personalizationScopeEligible: boolean;
        personalizationScopeApplied: boolean;
        aiPolicyVersion: string | null;
        planDecisionId: string | null;
        scopeDecisionId: string | null;
        onboardingDecisionId: string | null;
        policyFallbackUsed: boolean;
    }): boolean => {
        const body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
            const blob = new Blob([body], { type: 'application/json' });
            if (navigator.sendBeacon('/api/session/finalize', blob)) return true;
        }
        void fetch('/api/session/finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
        });
        return true;
    };

    const runFinalize = async (skipped = false): Promise<boolean> => {
        if (hasFinalizedRef.current) {
            setFinalizeStatus('success');
            return true;
        }
        if (finalizeInFlightRef.current) {
            return finalizeInFlightRef.current;
        }

        setFinalizeError(null);
        setFinalizeStatus('loading');
        const payload = {
            ...finalizePayload,
            skipped,
            reflectionCompletedAt: skipped ? null : new Date().toISOString(),
        };

        const pendingFinalize = (async () => {
            try {
                const response = await fetch('/api/session/finalize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    setFinalizeStatus('error');
                    setFinalizeError('Unable to save session. Try again.');
                    return false;
                }
                setHasFinalized(true);
                hasFinalizedRef.current = true;
                setFinalizeStatus('success');
                return true;
            } catch {
                setFinalizeStatus('error');
                setFinalizeError('Unable to save session. Try again.');
                return false;
            } finally {
                finalizeInFlightRef.current = null;
            }
        })();

        finalizeInFlightRef.current = pendingFinalize;
        return pendingFinalize;
    };

    const finalizeAndReturn = async (skipped = false) => {
        if (hasFinalizedRef.current) {
            setGenerating();
            router.replace('/home');
            router.refresh();
            return;
        }

        const finalized = await runFinalize(skipped);
        if (finalized) {
            setGenerating();
            router.replace('/home');
            router.refresh();
        }
    };

    const returnToDashboard = () => {
        void finalizeAndReturn(ritualStatus === 'skipped');
    };

    useEffect(() => {
        if (state.phase !== 'exit') return;

        const finalizeOnPageHide = () => {
            if (hasFinalizedRef.current) return;
            if (finalizeInFlightRef.current) return;
            if (!state.scope?.sessionId) return;

            const sent = sendFinalizeBeacon(finalizePayload);
            if (sent) {
                hasFinalizedRef.current = true;
                setHasFinalized(true);
                setFinalizeStatus('success');
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                finalizeOnPageHide();
            }
        };

        window.addEventListener('pagehide', finalizeOnPageHide);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('pagehide', finalizeOnPageHide);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [finalizePayload, state.phase, state.scope?.sessionId]);

    const introduced = state.exit?.delta?.introduced || [];
    const introducedSlugs = state.exit?.rawDelta?.introduced || [];

    const primaryConceptLabel = introduced[0];
    const primaryConceptSlug = introducedSlugs[0] || primaryConceptLabel;

    const supportConcepts = introduced.slice(1);
    const hasMore = supportConcepts.length > 1;

    useEffect(() => {
        if (state.phase === 'exit' && state.exit?.microSessionProposal && state.scope?.userId) {
            logTelemetryEvent({
                userId: state.scope.userId,
                trackSlug: state.scope.track.slug,
                sessionId: state.scope.sessionId || 'unknown',
                eventType: 'micro_shown',
                mode: 'exit',
                payload: {
                    proposalLabel: state.exit.microSessionProposal.label,
                    concept: state.exit.microSessionProposal.intent.text
                },
                dedupeKey: `micro_shown_${state.scope.sessionId}`
            });
        }
    }, [state.phase, state.exit?.microSessionProposal, state.scope]);

    if (state.phase !== 'exit' || !state.exit) {
        return null;
    }

    const { completedCount, durationMinutes } = state.exit;
    const wasAbandoned = completedCount === 0;
    const trackName = state.scope?.track?.name || 'Session';

    if (wasAbandoned) {
        return (
            <div 
                className="min-h-screen bg-background text-text-primary"
                data-chrome-mode="exit"
                data-has-micro-proposal="false"
            >
                <ExitHeader trackName={trackName} />
                <main className="pt-16 pb-20">
                    <div className={EXECUTION_SURFACE_LAYOUT_CLASS}>
                        <div className="max-w-md mx-auto text-center pt-24">
                            <p className="text-sm font-medium uppercase tracking-[0.2em] text-text-muted mb-6">
                                Session ended early
                            </p>
                            <h1 className="text-3xl font-bold text-text-primary mb-4">
                                Good checkpoint.
                            </h1>
                            <p className="text-text-secondary mb-12">
                                Pick up right where you left off next time.
                            </p>

                            <button
                                onClick={returnToDashboard}
                                disabled={finalizeStatus === 'loading'}
                                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-500 outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                            >
                                {finalizeStatus === 'loading' ? 'Saving...' : finalizeStatus === 'error' ? 'Retry' : 'Continue'}
                            </button>
                            {finalizeError && <p className="mt-3 text-xs text-red-400">{finalizeError}</p>}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const handleRitualComplete = async (skipped?: boolean) => {
        if (state.exit?.microSessionProposal) {
            setRitualStatus(skipped ? 'skipped' : 'completed');
        } else {
            if (skipped) {
                void finalizeAndReturn(true);
            }
        }
    };

    const handleReceiptContinue = async () => {
        if (state.exit?.microSessionProposal) {
            setRitualStatus('completed');
        } else {
            void finalizeAndReturn(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-background text-text-primary"
            data-chrome-mode="exit"
            data-has-micro-proposal={!!state.exit.microSessionProposal}
            data-ritual-status={ritualStatus}
            data-finalize-status={finalizeStatus}
        >
            <ExitHeader
                trackName={trackName}
                rightLabel={`${completedCount} step${completedCount === 1 ? '' : 's'} · ${Math.max(1, durationMinutes)} min`}
            />
            <main className="pt-16 pb-20">
                <div className={EXECUTION_SURFACE_LAYOUT_CLASS}>
                    <div className="max-w-md mx-auto w-full pt-12">
                <AnimatePresence mode="wait">
                    {ritualStatus === 'pending' ? (
                        <motion.div
                            key="ritual-flow"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <div className="text-center mb-12">
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                >
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted mb-6">
                                        Session completed
                                    </p>
                                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
                                        Session Complete
                                    </h1>
                                </motion.div>
                            </div>

                            {(primaryConceptLabel || supportConcepts.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                                className="bg-surface-interactive border border-border-subtle rounded-2xl p-8 mb-12"
                            >
                                <div className="space-y-8">
                                    {primaryConceptLabel && (
                                        <div>
                                            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted mb-2">
                                                Core Internalization
                                            </h3>
                                            <p className="text-xl font-medium text-text-primary leading-tight">
                                                {primaryConceptLabel}
                                            </p>
                                        </div>
                                    )}

                                    {supportConcepts.length > 0 && (
                                        <div className="pt-5 border-t border-border-subtle">
                                            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted mb-3">
                                                Supported Pattern
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {supportConcepts.slice(0, 2).map(item => (
                                                    <span key={item} className="px-2 py-1 rounded bg-surface-dense border border-border-subtle text-[11px] text-text-secondary">
                                                        {item}
                                                    </span>
                                                ))}
                                                {hasMore && (
                                                    <span className="text-[10px] text-text-muted self-center ml-1 italic">
                                                        + {supportConcepts.length - 1} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                            )}

                            <InternalizationRitual
                                primaryConcept={state.exit.primaryConcept || primaryConceptSlug}
                                intentType={state.scope?.items[0]?.intent.type || 'foundation'}
                                onComplete={handleRitualComplete}
                                onReceiptContinue={handleReceiptContinue}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="proposal-flow"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="text-center"
                        >
                            {state.exit.microSessionProposal ? (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-text-primary tracking-tight">
                                            Next practice
                                        </h2>
                                    </div>

                                    <div className="bg-surface-interactive border border-border-subtle rounded-2xl p-7">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                                                Practice Drill
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-surface-dense text-[9px] font-bold uppercase tracking-widest text-text-muted border border-border-subtle">
                                                {state.exit.microSessionProposal.estimatedMinutes}m
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-text-primary leading-tight">
                                            {state.exit.microSessionProposal.label}
                                        </h3>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (!state.exit?.microSessionProposal) return;
                                            const finalized = await runFinalize(ritualStatus === 'skipped');
                                            if (!finalized) return;
                                            const proposal = state.exit.microSessionProposal;

                                            const microItems: SessionItem[] = proposal.items.map(i => ({
                                                type: 'practice',
                                                title: i.title,
                                                subtitle: 'Micro-session',
                                                pillarSlug: state.scope?.track?.slug || '',
                                                href: i.href,
                                                estMinutes: proposal.estimatedMinutes,
                                                intent: proposal.intent
                                            }));

                                            logTelemetryEvent({
                                                userId: state.scope?.userId,
                                                trackSlug: state.scope?.track?.slug || 'dsa',
                                                sessionId: state.scope?.sessionId || 'unknown',
                                                eventType: 'micro_clicked',
                                                mode: 'exit',
                                                payload: {
                                                    proposalLabel: proposal.label
                                                },
                                                dedupeKey: `micro_clicked_${state.scope?.sessionId}`
                                            });

                                            commitSession({
                                                track: { slug: state.scope?.track?.slug || 'dsa', name: 'Micro-session' },
                                                items: microItems,
                                                estimatedMinutes: proposal.estimatedMinutes,
                                                exitCondition: 'Complete item',
                                                userId: state.scope?.userId,
                                                googleId: state.scope?.googleId,
                                                sessionId: state.scope?.sessionId
                                            });

                                            if (microItems[0]) {
                                                router.push(microItems[0].href);
                                            }
                                        }}
                                        disabled={finalizeStatus === 'loading'}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-500 outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                                    >
                                        {finalizeStatus === 'loading' ? 'Saving...' : finalizeStatus === 'error' ? 'Retry' : 'Begin Practice'}
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={returnToDashboard}
                                        disabled={finalizeStatus === 'loading'}
                                        className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted hover:text-text-primary transition-colors py-2"
                                    >
                                        {finalizeStatus === 'loading' ? 'Saving...' : 'Skip'}
                                    </button>
                                    {finalizeError && <p className="text-xs text-red-400">{finalizeError}</p>}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="w-12 h-12 bg-surface-dense border border-border-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-semibold text-text-primary tracking-tight">
                                        Session saved
                                    </h2>
                                    <button
                                        onClick={returnToDashboard}
                                        disabled={finalizeStatus === 'loading'}
                                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-500 disabled:opacity-70 outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                                    >
                                        {finalizeStatus === 'loading' ? 'Saving...' : finalizeStatus === 'error' ? 'Retry' : 'Continue'}
                                    </button>
                                    {finalizeError && <p className="text-xs text-red-400">{finalizeError}</p>}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}

function InternalizationRitual({
    primaryConcept,
    intentType,
    onComplete,
    onReceiptContinue
}: {
    primaryConcept: string | null;
    intentType: string;
    onComplete: (skipped?: boolean) => void;
    onReceiptContinue: () => void;
}) {
    const { state, resetToEntry } = useSessionContext();
    const [choiceType, setChoiceType] = useState<'A' | 'B' | 'FREEFORM' | null>(null);
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const choices = primaryConcept ? proposeRitualChoices({
        primaryConcept,
        intentType: intentType as IntentType
    }) : null;

    const isMapped = !!choices;

    const handleCommit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            if (state.scope?.userId) {
                logTelemetryEvent({
                    userId: state.scope.userId,
                    trackSlug: state.scope.track.slug,
                    sessionId: state.scope.sessionId || 'unknown',
                    eventType: 'ritual_completed',
                    mode: 'exit',
                    payload: {
                        choiceType,
                        textLength: text.length,
                        conceptSlug: primaryConcept
                    },
                    dedupeKey: `ritual_${state.scope.sessionId}`
                });

                const choiceLabel = choiceType === 'A' ? choices?.a : (choiceType === 'B' ? choices?.b : null);
                const finalNote = choiceType === 'FREEFORM' ? text : (choiceLabel || '');

                const { saveInternalization } = await import('@/app/actions/internalize');
                await saveInternalization(
                    {
                        sessionId: state.scope.sessionId || 'unknown',
                        picked: choiceType!,
                        concept: primaryConcept || 'unknown',
                        note: finalNote,
                        createdAt: new Date().toISOString(),
                        delta: state.exit?.delta,
                    },
                    state.scope.userId,
                    state.scope.track.slug,
                    state.scope.googleId
                );
            }

            setShowSuccess(true);
        } catch {
            setSubmitError('Could not save reflection. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        if (state.scope?.userId) {
            logTelemetryEvent({
                userId: state.scope.userId,
                trackSlug: state.scope.track.slug,
                sessionId: state.scope.sessionId || 'unknown',
                eventType: 'ritual_completed',
                mode: 'exit',
                payload: {
                    conceptSlug: primaryConcept,
                    skipped: true
                },
                dedupeKey: `ritual_skip_${state.scope.sessionId}`
            });
        }
        onComplete(true);
    };

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {showSuccess ? (
                    <motion.div
                        key="receipt-card"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="bg-surface-interactive border border-border-subtle rounded-2xl p-8 text-center"
                    >
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-surface-dense border border-border-subtle flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>

                            <p className="text-[10px] uppercase tracking-[0.25em] text-text-muted font-bold mb-2">
                                Internalization Confirmed
                            </p>

                            <h2 className="text-xl font-semibold text-text-primary mb-6">
                                {formatConceptLabel(primaryConcept)}
                            </h2>

                            <button
                                onClick={onReceiptContinue}
                                className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-500 outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 mb-4"
                            >
                                Continue
                            </button>

                            <Link
                                href="/learn/progress"
                                onClick={() => resetToEntry()}
                                className="text-xs text-text-muted hover:text-text-primary transition-colors border-b border-transparent hover:border-text-muted"
                            >
                                View internalization history
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="ritual-input"
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-3"
                    >
                        {isMapped && choices ? (
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { label: choices.a, value: 'A' },
                                    { label: choices.b, value: 'B' }
                                ].map((opt) => {
                                    const isSelected = choiceType === opt.value;
                                    const isOtherSelected = choiceType !== null && !isSelected;

                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                setChoiceType(opt.value as 'A' | 'B');
                                                setText(opt.label);
                                            }}
                                            className={`
                                                relative w-full p-5 rounded-xl border text-left transition-all duration-200
                                                ${isSelected
                                                    ? 'bg-surface-dense border-border-interactive text-text-primary'
                                                    : isOtherSelected
                                                        ? 'bg-transparent border-border-subtle text-text-muted opacity-40 hover:opacity-70'
                                                        : 'bg-surface-interactive border-border-subtle text-text-secondary hover:border-border-interactive hover:bg-surface-dense'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`
                                                    w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-200 mt-0.5
                                                    ${isSelected
                                                        ? 'border-border-interactive bg-surface-workbench'
                                                        : isOtherSelected
                                                            ? 'border-border-subtle opacity-50'
                                                            : 'border-border-interactive'
                                                    }
                                                `}>
                                                    {isSelected && (
                                                        <motion.svg
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="w-3 h-3 text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                                                        >
                                                            <path d="M5 13l4 4L19 7" />
                                                        </motion.svg>
                                                    )}
                                                </div>
                                                <span className={`text-sm font-medium leading-relaxed pr-2 transition-colors duration-200 ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="relative">
                                <textarea
                                    value={text}
                                    onChange={(e) => {
                                        setText(e.target.value);
                                        setChoiceType('FREEFORM');
                                    }}
                                    placeholder="In one sentence: what clicked?"
                                    className="w-full bg-surface-dense border border-border-subtle rounded-xl p-6 text-base font-mono text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-border-interactive transition-all min-h-[140px] resize-none leading-relaxed"
                                />
                                <div className={`absolute bottom-4 right-4 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 ${text.length >= 12 ? 'text-text-muted opacity-100' : 'text-text-muted opacity-40'}`}>
                                    {text.length < 12 ? (
                                        <span>{text.length}/12</span>
                                    ) : (
                                        <span>Ready</span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{
                                    opacity: (choiceType && (choiceType !== 'FREEFORM' || text.length >= 12)) ? 1 : 0,
                                    height: (choiceType && (choiceType !== 'FREEFORM' || text.length >= 12)) ? 'auto' : 0
                                }}
                                className="overflow-hidden"
                            >
                                <button
                                    onClick={handleCommit}
                                    disabled={isSubmitting || showSuccess}
                                    className={`
                                        w-full inline-flex items-center justify-center rounded-xl py-3 px-6 text-sm font-medium transition-all duration-300 relative overflow-hidden
                                        ${showSuccess
                                            ? 'bg-surface-dense text-text-secondary'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                        }
                                        disabled:opacity-70 outline-none focus-visible:ring-1 focus-visible:ring-emerald-400
                                    `}
                                >
                                    <span className={`transition-all duration-300 ${isSubmitting || showSuccess ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                                        Confirm Internalization
                                    </span>

                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSubmitting ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                        <svg className="animate-spin h-5 w-5 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>

                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                        <svg className="h-5 w-5 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                </button>
                            </motion.div>

                            <button
                                onClick={handleSkip}
                                disabled={isSubmitting || showSuccess}
                                className="block w-full text-center text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted hover:text-text-primary transition-all duration-300 py-2 opacity-50 hover:opacity-100 disabled:opacity-30"
                            >
                                Skip for now
                            </button>
                            {submitError && <p className="text-center text-xs text-red-400">{submitError}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ExitHeader({ trackName, rightLabel }: { trackName: string; rightLabel?: string }) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-interactive/28 bg-background/92">
            <div className={`${EXECUTION_SURFACE_LAYOUT_CLASS} py-1.5`}>
                <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.03em] text-text-muted">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <span className="text-[12px] uppercase text-text-primary/95">Session {trackName}</span>
                        {rightLabel && <span className="text-text-secondary">{rightLabel}</span>}
                    </div>
                </div>
            </div>
        </header>
    );
}
