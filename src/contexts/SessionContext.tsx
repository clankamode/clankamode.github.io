'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { SessionItem, LearningDelta } from '@/lib/progress';
import { type MicroSessionProposal, microSessionProviderV0 } from '@/lib/session-micro';
import { deriveLearningDelta, resolveDeltaLabels, fetchConceptDictionary } from '@/lib/delta-derivation';
import { proposeMicroSession } from '@/lib/micro-proposer';
import type { MicroProposal } from '@/types/micro';
import { STATIC_CONCEPT_INDEX } from '@/lib/concept-index';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { getUserLearningState } from '@/lib/user-learning-state';
import { logTelemetryEvent } from '@/lib/telemetry';

export type SessionPhase = 'idle' | 'entry' | 'execution' | 'exit';

export interface SessionScope {
    track: { slug: string; name: string };
    items: SessionItem[];
    estimatedMinutes: number;
    exitCondition: string;
    userId?: string;
    googleId?: string;
    sessionId?: string;
}

export interface SessionExecutionState {
    sessionId: string;
    currentIndex: number;
    completedItems: string[];
    startedAt: Date;
}

export interface SessionExitState {
    completedCount: number;
    durationMinutes: number;
    nextRecommendation: SessionItem | null;
    delta: LearningDelta;
    rawDelta?: LearningDelta;
    primaryConcept: string | null;
    microSessionProposal: MicroSessionProposal | null;
}

export interface SessionState {
    phase: SessionPhase;
    scope: SessionScope | null;
    execution: SessionExecutionState | null;
    exit: SessionExitState | null;
}

interface SessionContextValue {
    state: SessionState;
    isInSession: boolean;
    commitSession: (scope: SessionScope) => void;
    advanceItem: () => void;
    completeSession: () => void;
    abandonSession: () => void;
    resetToEntry: () => void;
}

const initialState: SessionState = {
    phase: 'idle',
    scope: null,
    execution: null,
    exit: null,
};

function toSessionProposal(p: MicroProposal): MicroSessionProposal {
    return {
        id: crypto.randomUUID(),
        label: `Next: ${p.item.title} (${p.item.estMinutes} min)`,
        estimatedMinutes: p.item.estMinutes,
        intent: { type: p.intent.type, text: p.intent.text },
        items: [{ title: p.item.title, href: p.item.href, type: p.item.type === 'learn' ? 'article' : 'exercise' }],
    };
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<SessionState>(initialState);
    const router = useRouter();
    const pathname = usePathname();
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => { isMountedRef.current = false; };
    }, []);

    const isInSession = state.phase === 'execution';

    useEffect(() => {
        if (state.phase === 'exit' && pathname !== '/home' && pathname !== '/learn/progress') {
            router.push('/home');
        }
    }, [state.phase, pathname, router]);

    const commitSession = useCallback((scope: SessionScope) => {
        setState({
            phase: 'execution',
            scope,
            execution: {
                sessionId: scope.sessionId || crypto.randomUUID(),
                currentIndex: 0,
                completedItems: [],
                startedAt: new Date(),
            },
            exit: null,
        });
    }, []);

    const advanceItem = useCallback(() => {
        setState((prev) => {
            if (!prev.execution || !prev.scope) return prev;

            const currentItem = prev.scope.items[prev.execution.currentIndex];
            const newCompletedItems = [...prev.execution.completedItems, currentItem?.href || ''];
            const newIndex = prev.execution.currentIndex + 1;

            if (currentItem && prev.scope.userId) {
                logTelemetryEvent({
                    userId: prev.scope.userId,
                    trackSlug: prev.scope.track.slug,
                    sessionId: prev.execution.sessionId,
                    eventType: 'item_completed',
                    mode: 'execute',
                    payload: {
                        itemHref: currentItem.href,
                        itemTitle: currentItem.title,
                        index: prev.execution.currentIndex
                    },
                    dedupeKey: `completed_${prev.execution.sessionId}_${currentItem.href}`
                });
            }

            const scope = prev.scope;
            if (newIndex >= scope.items.length) {
                const durationMinutes = Math.round(
                    (Date.now() - prev.execution.startedAt.getTime()) / 60000
                );

                const initialDelta: LearningDelta = {
                    introduced: [],
                    reinforced: [],
                    unlocked: []
                };

                const getProposal = (currentDelta: LearningDelta): MicroSessionProposal | null => {
                    const useV1 = isFeatureEnabled(FeatureFlags.USE_MICRO_V1);
                    if (useV1) {
                        const p = proposeMicroSession({
                            trackSlug: scope.track.slug,
                            delta: currentDelta,
                            conceptIndex: STATIC_CONCEPT_INDEX
                        });
                        return p ? toSessionProposal(p) : null;
                    }
                    return microSessionProviderV0.propose({
                        trackSlug: scope.track.slug,
                        delta: currentDelta
                    });
                };

                const completedItems = scope.items.slice(0, newIndex);
                const trackSlug = scope.track.slug;

                setTimeout(async () => {
                    try {
                        const userId = scope.userId;
                        const result = await deriveLearningDelta(
                            userId || 'anonymous',
                            trackSlug,
                            completedItems,
                            scope.googleId
                        );
                        const conceptDict = await fetchConceptDictionary(trackSlug);
                        const labeledDelta = resolveDeltaLabels(result.delta, conceptDict);

                        const useGenerative = isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS) && !!userId;
                        let freshProposal: MicroSessionProposal | null = null;

                        if (useGenerative) {
                            const { userState } = await getUserLearningState(userId, trackSlug, scope.googleId);
                            const p = proposeMicroSession({
                                trackSlug,
                                delta: result.delta,
                                conceptIndex: STATIC_CONCEPT_INDEX,
                                userState
                            });
                            freshProposal = p ? toSessionProposal(p) : null;
                        } else if (isFeatureEnabled(FeatureFlags.USE_MICRO_V1)) {
                            const p = proposeMicroSession({
                                trackSlug,
                                delta: result.delta,
                                conceptIndex: STATIC_CONCEPT_INDEX
                            });
                            freshProposal = p ? toSessionProposal(p) : null;
                        } else {
                            freshProposal = microSessionProviderV0.propose({
                                trackSlug,
                                delta: labeledDelta
                            });
                        }

                        if (!isMountedRef.current) return;

                        setState(prev => {
                            if (prev.phase !== 'exit' || !prev.exit) return prev;
                            return {
                                ...prev,
                                exit: {
                                    ...prev.exit,
                                    delta: labeledDelta,
                                    rawDelta: result.delta,
                                    primaryConcept: scope.items[0]?.primaryConceptSlug || null,
                                    microSessionProposal: freshProposal
                                }
                            };
                        });
                    } catch (e) {
                        console.error('Delta derivation failed:', e);
                    }
                }, 0);

                const microSessionProposal = getProposal(initialDelta);

                return {
                    phase: 'exit',
                    scope: prev.scope,
                    execution: null,
                    exit: {
                        completedCount: newCompletedItems.length,
                        durationMinutes,
                        nextRecommendation: null,
                        delta: initialDelta,
                        primaryConcept: scope.items[0]?.primaryConceptSlug || null,
                        microSessionProposal,
                    },
                };
            }

            return {
                ...prev,
                execution: {
                    ...prev.execution,
                    currentIndex: newIndex,
                    completedItems: newCompletedItems,
                },
            };
        });
    }, []);

    const completeSession = useCallback(() => {
        setState((prev) => {
            if (!prev.execution || !prev.scope) return prev;

            const durationMinutes = Math.round(
                (Date.now() - prev.execution.startedAt.getTime()) / 60000
            );

            const delta: LearningDelta = {
                introduced: [],
                reinforced: [],
                unlocked: []
            };

            const microSessionProposal = isFeatureEnabled(FeatureFlags.USE_MICRO_V1)
                ? (() => {
                    const p = proposeMicroSession({ trackSlug: prev.scope.track.slug, delta, conceptIndex: STATIC_CONCEPT_INDEX });
                    return p ? toSessionProposal(p) : null;
                })()
                : microSessionProviderV0.propose({ trackSlug: prev.scope.track.slug, delta });

            return {
                phase: 'exit',
                scope: prev.scope,
                execution: null,
                exit: {
                    completedCount: prev.execution.completedItems.length,
                    durationMinutes,
                    nextRecommendation: null,
                    delta,
                    rawDelta: delta,
                    primaryConcept: null,
                    microSessionProposal
                },
            };
        });
    }, []);

    const abandonSession = useCallback(() => {
        setState((prev) => {
            if (!prev.execution || !prev.scope) return prev;

            const durationMinutes = Math.round(
                (Date.now() - prev.execution.startedAt.getTime()) / 60000
            );

            return {
                phase: 'exit',
                scope: prev.scope,
                execution: null,
                exit: {
                    completedCount: prev.execution.completedItems.length,
                    durationMinutes,
                    nextRecommendation: null,
                    delta: { introduced: [], reinforced: [], unlocked: [] },
                    rawDelta: { introduced: [], reinforced: [], unlocked: [] },
                    primaryConcept: null,
                    microSessionProposal: null,
                },
            };
        });
    }, []);

    const resetToEntry = useCallback(() => {
        setState(initialState);
    }, []);

    return (
        <SessionContext.Provider
            value={{
                state,
                isInSession,
                commitSession,
                advanceItem,
                completeSession,
                abandonSession,
                resetToEntry,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}

export function useIsInSession(): boolean {
    const context = useContext(SessionContext);
    return context?.isInSession ?? false;
}
