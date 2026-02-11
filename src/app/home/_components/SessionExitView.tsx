'use client';

import { useSession as useSessionContext } from '@/contexts/SessionContext';
import { useRouter } from 'next/navigation';
import type { SessionItem } from '@/lib/progress';
import { useState, useEffect } from 'react';
import { logTelemetryEvent } from '@/lib/telemetry';
import { AnimatePresence, motion } from 'framer-motion';
import { proposeRitualChoices, type IntentType } from '@/lib/ritual_prompts';

export default function SessionExitView() {
    const { state, resetToEntry, commitSession } = useSessionContext();
    const router = useRouter();

    const [ritualStatus, setRitualStatus] = useState<'pending' | 'completed' | 'skipped'>('pending');
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
    const wasAbandoned = completedCount === 0 && durationMinutes < 2;
    const trackName = state.scope?.track?.name || 'Session';

    if (wasAbandoned) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="max-w-md mx-auto px-6 text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-text-muted mb-6">
                        Session ended early
                    </p>
                    <h1 className="text-3xl font-bold text-text-primary mb-4">
                        That&apos;s okay.
                    </h1>
                    <p className="text-text-secondary mb-12">
                        Progress isn&apos;t linear. See you next time.
                    </p>

                    <button
                        onClick={resetToEntry}
                        className="w-full py-4 rounded-full bg-white/[0.03] border border-white/10 text-text-primary font-medium transition-all hover:bg-white/[0.06] hover:border-white/20"
                    >
                        Return to gate
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main
            className="min-h-screen bg-background flex items-center justify-center py-12 relative"
            data-chrome-mode="exit"
            data-has-micro-proposal={!!state.exit.microSessionProposal}
            data-ritual-status={ritualStatus}
        >
            <div className="max-w-md mx-auto px-6 w-full">
                <div className="text-center mb-10">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-primary mb-4">
                        Session completed
                    </p>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">
                        Lock it in.
                    </h1>
                </div>

                <div className="bg-surface-ambient border border-white/5 rounded-2xl p-6 mb-10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="relative space-y-6">
                        <div className="flex items-center justify-between text-xs text-text-muted uppercase tracking-[0.2em]">
                            <span>{trackName}</span>
                            <span>{completedCount} steps · {durationMinutes} min</span>
                        </div>

                        {primaryConceptLabel && (
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                                    Primary Focus
                                </h3>
                                <p className="text-lg font-medium text-text-primary leading-relaxed">
                                    {primaryConceptLabel}
                                </p>
                            </div>
                        )}

                        {supportConcepts.length > 0 && (
                            <div className="pt-2 border-t border-white/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
                                    Aligned Patterns
                                </h3>
                                <ul className="space-y-2">
                                    {supportConcepts.slice(0, 1).map(item => (
                                        <li key={item} className="text-sm text-text-secondary">
                                            {item}
                                        </li>
                                    ))}
                                    {hasMore && (
                                        <li className="text-xs text-text-muted italic">
                                            + {supportConcepts.length - 1} more related concepts
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {(state.exit.delta.unlocked.length > 0 || state.exit.delta.reinforced.length > 0) && (
                            <div className="pt-2 border-t border-white/5 flex gap-4 text-xs text-text-muted">
                                {state.exit.delta.unlocked.length > 0 && (
                                    <span>{state.exit.delta.unlocked.length} unlocked</span>
                                )}
                                {state.exit.delta.reinforced.length > 0 && (
                                    <span>{state.exit.delta.reinforced.length} reinforced</span>
                                )}
                            </div>
                        )}

                        {introduced.length === 0 &&
                            state.exit.delta.reinforced.length === 0 &&
                            state.exit.delta.unlocked.length === 0 && (
                                <p className="text-sm text-text-muted">
                                    Observation mode. No derived signal captured.
                                </p>
                            )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {ritualStatus === 'pending' ? (
                        <motion.div
                            key="ritual"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <InternalizationRitual
                                primaryConcept={state.exit.primaryConcept || primaryConceptSlug}
                                intentType={state.scope?.items[0]?.intent.type || 'foundation'}
                                onComplete={(skipped) => setRitualStatus(skipped ? 'skipped' : 'completed')}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="next"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="text-center space-y-6"
                        >
                            {ritualStatus === 'completed' && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl inline-flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-green-200">Saved to your fingerprint.</span>
                                </div>
                            )}

                            {state.exit.microSessionProposal ? (
                                <div className="space-y-4 pt-4">
                                    <p className="text-sm text-text-muted">
                                        You&apos;re in flow. One constraint, one payoff:
                                    </p>
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
                                        className="w-full group bg-surface-elevated hover:bg-surface-floating border border-white/5 hover:border-white/10 rounded-xl p-6 transition-all text-left"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold uppercase tracking-widest text-brand-blue">
                                                Next Micro-Session
                                            </span>
                                            <span className="text-xs text-text-muted">
                                                {state.exit.microSessionProposal.estimatedMinutes} min
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-text-primary group-hover:text-brand-blue transition-colors">
                                            {state.exit.microSessionProposal.label}
                                        </h3>
                                        <p className="text-sm text-text-secondary mt-1">
                                            Pressure-test this concept immediately.
                                        </p>
                                    </button>

                                    <button
                                        onClick={resetToEntry}
                                        className="text-xs text-text-muted hover:text-text-primary transition-colors py-2"
                                    >
                                        Return to dashboard
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-8">
                                    <button
                                        onClick={resetToEntry}
                                        className="text-sm font-medium text-text-primary hover:text-white transition-colors"
                                    >
                                        Return to dashboard
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
    onComplete
}: {
    primaryConcept: string | null;
    intentType: string;
    onComplete: (skipped?: boolean) => void;
}) {
    const { state } = useSessionContext();
    const [choiceType, setChoiceType] = useState<'A' | 'B' | 'FREEFORM' | null>(null);
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        setTimeout(() => {
            setIsSubmitting(false);
            onComplete(false);
        }, 300);
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
            <div className="space-y-3">
                {isMapped && choices ? (
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { label: choices.a, value: 'A' },
                            { label: choices.b, value: 'B' }
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setChoiceType(opt.value as 'A' | 'B');
                                    setText(opt.label);
                                }}
                                className={`
                                    relative w-full p-4 rounded-xl border text-left transition-all duration-300 group
                                    ${choiceType === opt.value
                                        ? 'bg-accent-primary/10 border-accent-primary/50 text-text-primary shadow-[0_0_15px_rgba(56,189,248,0.1)] scale-[1.02]'
                                        : 'bg-white/[0.02] border-white/5 text-text-secondary hover:bg-white/[0.04] hover:border-white/10'
                                    }
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`
                                        w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors duration-300 mt-0.5
                                        ${choiceType === opt.value
                                            ? 'border-accent-primary bg-accent-primary'
                                            : 'border-white/20 group-hover:border-white/40'
                                        }
                                    `}>
                                        {choiceType === opt.value && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-2 h-2 rounded-full bg-black"
                                            />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium leading-relaxed">{opt.label}</span>
                                </div>
                            </button>
                        ))}
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
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 focus:bg-white/[0.05] transition-all min-h-[100px] resize-none text-sm leading-relaxed"
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                            {text.length} / 12 chars
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
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
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all duration-300 bg-white text-black shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:bg-white/90 transform hover:-translate-y-0.5"
                    >
                        {isSubmitting ? 'Locking...' : 'Lock it in'}
                    </button>
                </motion.div>

                <button
                    onClick={handleSkip}
                    className="block w-full text-center text-xs text-text-muted hover:text-text-primary transition-colors opacity-60 hover:opacity-100"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
}
