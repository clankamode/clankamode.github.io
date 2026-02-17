'use client';

import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { useRouter } from 'next/navigation';
import type { SessionItem } from '@/lib/progress';
import { useState, useEffect, useMemo, useRef } from 'react';
import { logTelemetryEvent } from '@/lib/telemetry';
import { AnimatePresence, motion } from 'framer-motion';
import { proposeRitualChoices, type IntentType } from '@/lib/ritual_prompts';
import Link from 'next/link';

export default function SessionExitView() {
    const { state, commitSession, setGenerating } = useSessionContext();
    const router = useRouter();
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [hasFinalized, setHasFinalized] = useState(false);
    const hasFinalizedRef = useRef(false);

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

    const finalizeAndReturn = async (skipped = false) => {
        if (hasFinalizedRef.current || isFinalizing) {
            setGenerating();
            router.replace('/home');
            router.refresh();
            return;
        }

        const payload = {
            ...finalizePayload,
            skipped,
            reflectionCompletedAt: skipped ? null : new Date().toISOString(),
        };

        setIsFinalizing(true);
        try {
            await fetch('/api/session/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            setHasFinalized(true);
            hasFinalizedRef.current = true;
        } finally {
            setIsFinalizing(false);
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
            if (!state.scope?.sessionId) return;

            const sent = sendFinalizeBeacon(finalizePayload);
            if (sent) {
                hasFinalizedRef.current = true;
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
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="max-w-md mx-auto px-6 text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-text-muted mb-6">
                        Session ended early
                    </p>
                    <h1 className="text-3xl font-bold text-text-primary mb-4">
                        Good checkpoint.
                    </h1>
                    <p className="text-text-secondary mb-12">
                        You kept the chain alive. Come back when you&apos;re ready and pick up right where you left off.
                    </p>

                    <button
                        onClick={returnToDashboard}
                        className="w-full py-4 rounded-full border border-border-interactive/60 bg-surface-interactive/30 text-text-primary font-medium transition-all hover:border-border-interactive/85 hover:bg-surface-interactive/45"
                    >
                        Return to gate
                    </button>
                </div>
            </main>
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
        <main
            className="min-h-screen bg-background flex items-center justify-center py-12 relative"
            data-chrome-mode="exit"
            data-has-micro-proposal={!!state.exit.microSessionProposal}
            data-ritual-status={ritualStatus}
        >
            <div className="max-w-md mx-auto px-6 w-full">
                <AnimatePresence mode="wait">
                    {ritualStatus === 'pending' ? (
                        <motion.div
                            key="ritual-flow"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <div className="text-center mb-10">
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent-primary mb-4">
                                    Session completed
                                </p>
                                <h1 className="text-4xl font-bold text-text-primary tracking-tight">
                                    Lock it in.
                                </h1>
                            </div>

                            <div className="bg-surface-interactive border border-border-subtle rounded-2xl p-7 mb-10 relative group transition-all duration-300">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between text-[10px] text-text-muted uppercase tracking-widest font-sans font-bold">
                                        <span>{trackName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-border-interactive" />
                                            <span>{completedCount} steps · {durationMinutes} min</span>
                                        </div>
                                    </div>

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
                            </div>

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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
                            className="text-center"
                        >
                            {state.exit.microSessionProposal ? (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                                            Keep the momentum?
                                        </h2>
                                        <p className="text-sm text-text-secondary max-w-[280px] mx-auto leading-relaxed">
                                            You&apos;re in flow. One constraint, one targeted payoff.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (!state.exit?.microSessionProposal) return;
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
                                        className="w-full text-left bg-surface-interactive border border-border-subtle rounded-2xl p-7 transition-all duration-300 hover:border-border-interactive hover:-translate-y-1 hover:shadow-xl group"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-primary">
                                                Lock In This Concept
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-accent-primary/5 text-[9px] font-bold uppercase tracking-widest text-accent-primary/80 border border-accent-primary/10">
                                                {state.exit.microSessionProposal.estimatedMinutes}m
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-text-primary transition-colors leading-tight">
                                            {state.exit.microSessionProposal.label}
                                        </h3>
                                        <p className="text-sm text-text-muted mt-3 leading-relaxed">
                                            Pressure-test the pattern you just learned with a targeted implementation drill.
                                        </p>

                                        <div className="mt-8 flex items-center justify-between">
                                            <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors flex items-center gap-2">
                                                Start Drill
                                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={returnToDashboard}
                                        disabled={isFinalizing}
                                        className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted hover:text-text-primary transition-colors py-4 px-8"
                                    >
                                        {isFinalizing ? 'Saving...' : 'Return to dashboard'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                                        Done for now.
                                    </h2>
                                    <button
                                        onClick={returnToDashboard}
                                        disabled={isFinalizing}
                                        className="w-full py-4 rounded-full bg-foreground text-background font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                                    >
                                        {isFinalizing ? 'Saving...' : 'Return to dashboard'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
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

    const choices = primaryConcept ? proposeRitualChoices({
        primaryConcept,
        intentType: intentType as IntentType
    }) : null;

    const isMapped = !!choices;

    const handleCommit = async () => {
        setIsSubmitting(true);
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

        setIsSubmitting(false);
        setShowSuccess(true);
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
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                        className="bg-surface-interactive border border-accent-primary/20 rounded-2xl p-8 text-center relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-4 ring-1 ring-accent-primary/20">
                                <svg className="w-8 h-8 text-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>

                            <p className="text-[10px] uppercase tracking-[0.25em] text-accent-primary font-bold mb-2">
                                Internalization Confirmed
                            </p>

                            <h2 className="text-2xl font-bold text-text-primary mb-6">
                                Locked in: <span className="text-accent-primary">{primaryConcept || 'Concept'}</span>
                            </h2>

                            <button
                                onClick={onReceiptContinue}
                                className="w-full py-3 rounded-full bg-text-primary text-surface-ambient font-bold text-xs uppercase tracking-widest hover:bg-text-primary/90 transition-all mb-4"
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
                        exit={{ opacity: 0, y: -20 }}
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
                                                relative w-full p-5 rounded-xl border text-left transition-all duration-300 group overflow-hidden
                                                ${isSelected
                                                    ? 'bg-accent-primary/5 border-accent-primary/40 text-text-primary ring-1 ring-accent-primary/20 scale-[1.02] shadow-lg'
                                                    : isOtherSelected
                                                        ? 'bg-transparent border-border-subtle text-text-muted opacity-50 hover:opacity-100 grayscale hover:grayscale-0'
                                                        : 'bg-surface-interactive border-border-subtle text-text-secondary hover:border-border-interactive hover:bg-surface-dense hover:-translate-y-0.5'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start gap-4 relative z-10">
                                                <div className={`
                                                    w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-300 mt-0.5
                                                    ${isSelected
                                                        ? 'border-accent-primary bg-accent-primary scale-110'
                                                        : isOtherSelected
                                                            ? 'border-border-subtle opacity-50'
                                                            : 'border-border-interactive group-hover:border-text-muted'
                                                    }
                                                `}>
                                                    {isSelected && (
                                                        <motion.svg
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"
                                                        >
                                                            <path d="M5 13l4 4L19 7" />
                                                        </motion.svg>
                                                    )}
                                                </div>
                                                <span className={`text-sm font-medium leading-relaxed pr-2 transition-colors duration-300 ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="ritual-choice-glow"
                                                    className="absolute inset-0 bg-gradient-to-r from-accent-primary/10 via-accent-primary/5 to-transparent pointer-events-none"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="relative group">
                                <textarea
                                    value={text}
                                    onChange={(e) => {
                                        setText(e.target.value);
                                        setChoiceType('FREEFORM');
                                    }}
                                    placeholder="In one sentence: what clicked?"
                                    className={`
                                        w-full bg-surface-interactive border rounded-xl p-5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary/30 transition-all min-h-[120px] resize-none text-sm leading-relaxed
                                        ${choiceType === 'FREEFORM'
                                            ? 'border-accent-primary/40 bg-surface-dense'
                                            : 'border-border-subtle focus:border-accent-primary/30'
                                        }
                                    `}
                                />
                                <div className="absolute bottom-4 right-4 text-[10px] text-text-muted uppercase tracking-widest font-bold opacity-60 group-focus-within:opacity-100 transition-opacity">
                                    {text.length} / 12
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
                                        w-full py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] transition-all duration-500 relative overflow-hidden
                                        ${showSuccess
                                            ? 'bg-accent-primary text-black'
                                            : 'bg-foreground text-background hover:opacity-90 shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:-translate-y-0.5'
                                        }
                                        disabled:opacity-70 disabled:hover:translate-y-0
                                    `}
                                >
                                    <span className={`transition-all duration-300 ${isSubmitting || showSuccess ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                                        Confirm Internalization
                                    </span>

                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSubmitting ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                        <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>

                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                        <svg className="h-6 w-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
