'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { SessionItem, LearningDelta } from '@/lib/progress';
import { type MicroSessionProposal, microSessionProviderV0 } from '@/lib/session-micro';
import { deriveLearningDelta, resolveDeltaLabels, fetchConceptDictionary, updateUserConceptStats } from '@/lib/delta-derivation';
import { proposeMicroSession } from '@/lib/micro-proposer';
import type { MicroProposal } from '@/types/micro';
import { STATIC_CONCEPT_INDEX } from '@/lib/concept-index';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { getUserLearningState } from '@/lib/user-learning-state';
import { logTelemetryEvent } from '@/lib/telemetry';
import { createTransitionLock, type TransitionKind } from '@/lib/transition-lock';

export type SessionPhase = 'idle' | 'entry' | 'execution' | 'exit';
type SessionTransitionStatus = 'ready' | 'advancing' | 'finalizing';
const SESSION_STATE_STORAGE_KEY = 'session:state:v1';
const LAST_MICRO_CONCEPT_STORAGE_KEY = 'session:last-micro-concept:v1';

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
    currentChunk: number;
    totalChunks: number;
    transitionStatus: SessionTransitionStatus;
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
    transitionStatus: SessionTransitionStatus;
}

interface SessionContextValue {
    state: SessionState;
    isInSession: boolean;
    commitSession: (scope: SessionScope) => void;
    advanceItem: () => void;
    completeSession: () => void;
    abandonSession: () => void;
    resetToEntry: () => void;
    nextChunk: () => void;
    prevChunk: () => void;
    setTotalChunks: (total: number) => void;
}

const initialState: SessionState = {
    phase: 'idle',
    scope: null,
    execution: null,
    exit: null,
    transitionStatus: 'ready',
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

function getLastMicroConcept(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const value = window.localStorage.getItem(LAST_MICRO_CONCEPT_STORAGE_KEY);
        if (!value) return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    } catch {
        return null;
    }
}

function setLastMicroConcept(conceptSlug: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(LAST_MICRO_CONCEPT_STORAGE_KEY, conceptSlug);
    } catch {
    }
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<SessionState>(initialState);
    const stateRef = useRef<SessionState>(initialState);
    const router = useRouter();
    const pathname = usePathname();
    const isMountedRef = useRef(true);
    const transitionLockRef = useRef(createTransitionLock());

    useEffect(() => {
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = window.sessionStorage.getItem(SESSION_STATE_STORAGE_KEY);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw) as SessionState;
            if (!parsed || !parsed.phase || parsed.phase === 'idle') return;

            setState({
                ...parsed,
                execution: parsed.execution
                    ? {
                        ...parsed.execution,
                        startedAt: new Date(parsed.execution.startedAt),
                        transitionStatus: 'ready',
                    }
                    : null,
                transitionStatus: 'ready',
            });
        } catch {
            window.sessionStorage.removeItem(SESSION_STATE_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (state.phase === 'idle') {
            window.sessionStorage.removeItem(SESSION_STATE_STORAGE_KEY);
            return;
        }
        window.sessionStorage.setItem(SESSION_STATE_STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const isInSession = state.phase === 'execution';

    useEffect(() => {
        if (state.phase === 'exit' && pathname !== '/home' && pathname !== '/learn/progress') {
            router.push('/home');
        }
    }, [state.phase, pathname, router]);

    const commitSession = useCallback((scope: SessionScope) => {
        const sessionId = scope.sessionId || crypto.randomUUID();
        const executionState: SessionExecutionState = {
            sessionId,
            currentIndex: 0,
            completedItems: [],
            startedAt: new Date(),
            currentChunk: 0,
            totalChunks: 1,
            transitionStatus: 'ready',
        };

        if (scope.userId) {
            logTelemetryEvent({
                userId: scope.userId,
                trackSlug: scope.track.slug,
                sessionId,
                eventType: 'session_started',
                mode: 'execute',
                payload: {
                    itemCount: scope.items.length,
                    estimatedMinutes: scope.estimatedMinutes,
                },
                dedupeKey: `session_started_${sessionId}`,
            });
        }

        setState({
            phase: 'execution',
            scope: { ...scope, sessionId },
            execution: executionState,
            exit: null,
            transitionStatus: 'ready',
        });
    }, []);

    const setTransitionStatus = useCallback((kind: TransitionKind) => {
        setState((prev) => ({
            ...prev,
            transitionStatus: kind,
            execution: prev.execution
                ? {
                    ...prev.execution,
                    transitionStatus: kind,
                }
                : prev.execution,
        }));
    }, []);

    const resetTransitionStatus = useCallback((kind: TransitionKind) => {
        setState((prev) => {
            if (prev.transitionStatus !== kind) {
                return prev;
            }

            return {
                ...prev,
                transitionStatus: 'ready',
                execution: prev.execution
                    ? {
                        ...prev.execution,
                        transitionStatus: 'ready',
                    }
                    : prev.execution,
            };
        });
    }, []);

    const runWithTransitionLock = useCallback((kind: TransitionKind, operation: () => void) => {
        if (!transitionLockRef.current.acquire(kind)) {
            return false;
        }

        setTransitionStatus(kind);

        try {
            operation();
            return true;
        } finally {
            setTimeout(() => {
                transitionLockRef.current.release();
                resetTransitionStatus(kind);
            }, 0);
        }
    }, [resetTransitionStatus, setTransitionStatus]);

    const advanceItem = useCallback(() => {
        runWithTransitionLock('advancing', () => {
            const prev = stateRef.current;
            if (!prev.execution || !prev.scope) return;

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
                logTelemetryEvent({
                    userId: prev.scope.userId,
                    trackSlug: prev.scope.track.slug,
                    sessionId: prev.execution.sessionId,
                    eventType: 'step_completed',
                    mode: 'execute',
                    payload: {
                        stepIndex: prev.execution.currentIndex + 1,
                        totalSteps: prev.scope.items.length,
                        itemHref: currentItem.href,
                    },
                    dedupeKey: `step_completed_${prev.execution.sessionId}_${prev.execution.currentIndex}`,
                });
            }

            const scope = prev.scope;
            if (newIndex >= scope.items.length) {
                const durationMinutes = Math.round(
                    (Date.now() - prev.execution.startedAt.getTime()) / 60000
                );
                const previousMicroConcept = getLastMicroConcept();
                const proposalAvoidConcepts = previousMicroConcept ? [previousMicroConcept] : [];

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
                            conceptIndex: STATIC_CONCEPT_INDEX,
                            avoidConcepts: proposalAvoidConcepts,
                        });
                        if (p?.targetConcept) {
                            setLastMicroConcept(p.targetConcept);
                        }
                        return p ? toSessionProposal(p) : null;
                    }
                    return microSessionProviderV0.propose({
                        trackSlug: scope.track.slug,
                        delta: currentDelta
                    });
                };

                const completedItems = scope.items.slice(0, newIndex);
                const trackSlug = scope.track.slug;
                const microSessionProposal = getProposal(initialDelta);

                setState({
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
                    transitionStatus: 'ready',
                });

                setTimeout(async () => {
                    try {
                        const userId = scope.userId;
                        const result = await deriveLearningDelta(
                            userId || 'anonymous',
                            trackSlug,
                            completedItems,
                            scope.googleId
                        );
                        if (userId && result.debugInfo.seenTags.length > 0) {
                            await updateUserConceptStats(
                                userId,
                                trackSlug,
                                result.debugInfo.seenTags,
                                undefined,
                                scope.googleId
                            );
                        }
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
                                userState,
                                avoidConcepts: proposalAvoidConcepts,
                            });
                            if (p?.targetConcept) {
                                setLastMicroConcept(p.targetConcept);
                            }
                            freshProposal = p ? toSessionProposal(p) : null;
                        } else if (isFeatureEnabled(FeatureFlags.USE_MICRO_V1)) {
                            const p = proposeMicroSession({
                                trackSlug,
                                delta: result.delta,
                                conceptIndex: STATIC_CONCEPT_INDEX,
                                avoidConcepts: proposalAvoidConcepts,
                            });
                            if (p?.targetConcept) {
                                setLastMicroConcept(p.targetConcept);
                            }
                            freshProposal = p ? toSessionProposal(p) : null;
                        } else {
                            freshProposal = microSessionProviderV0.propose({
                                trackSlug,
                                delta: labeledDelta
                            });
                        }

                        if (!isMountedRef.current) return;

                        setState(prevState => {
                            if (prevState.phase !== 'exit' || !prevState.exit) return prevState;
                            return {
                                ...prevState,
                                exit: {
                                    ...prevState.exit,
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
                return;
            }

            setState({
                ...prev,
                execution: {
                    ...prev.execution,
                    currentIndex: newIndex,
                    completedItems: newCompletedItems,
                    currentChunk: 0,
                    totalChunks: 1,
                    transitionStatus: 'ready',
                },
                transitionStatus: 'ready',
            });
        });
    }, [runWithTransitionLock]);

    const completeSession = useCallback(() => {
        runWithTransitionLock('finalizing', () => {
            setState((prev) => {
                if (!prev.execution || !prev.scope) return prev;
                if (prev.execution.transitionStatus !== 'finalizing' || prev.transitionStatus !== 'finalizing') return prev;

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
                        const previousMicroConcept = getLastMicroConcept();
                        const p = proposeMicroSession({
                            trackSlug: prev.scope.track.slug,
                            delta,
                            conceptIndex: STATIC_CONCEPT_INDEX,
                            avoidConcepts: previousMicroConcept ? [previousMicroConcept] : [],
                        });
                        if (p?.targetConcept) {
                            setLastMicroConcept(p.targetConcept);
                        }
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
                    transitionStatus: 'ready',
                };
            });
        });
    }, [runWithTransitionLock]);

    const abandonSession = useCallback(() => {
        runWithTransitionLock('finalizing', () => {
            setState((prev) => {
                if (!prev.execution || !prev.scope) return prev;
                if (prev.execution.transitionStatus !== 'finalizing' || prev.transitionStatus !== 'finalizing') return prev;

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
                    transitionStatus: 'ready',
                };
            });
        });
    }, [runWithTransitionLock]);

    const resetToEntry = useCallback(() => {
        setState(initialState);
    }, []);

    const nextChunk = useCallback(() => {
        setState((prev) => {
            if (!prev.execution || prev.execution.currentChunk >= prev.execution.totalChunks - 1) {
                return prev;
            }
            return {
                ...prev,
                execution: {
                    ...prev.execution,
                    currentChunk: prev.execution.currentChunk + 1,
                },
            };
        });
    }, []);

    const prevChunk = useCallback(() => {
        setState((prev) => {
            if (!prev.execution || prev.execution.currentChunk <= 0) {
                return prev;
            }
            return {
                ...prev,
                execution: {
                    ...prev.execution,
                    currentChunk: prev.execution.currentChunk - 1,
                },
            };
        });
    }, []);

    const setTotalChunks = useCallback((total: number) => {
        setState((prev) => {
            if (!prev.execution) return prev;
            return {
                ...prev,
                execution: {
                    ...prev.execution,
                    totalChunks: Math.max(1, total),
                },
            };
        });
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
                nextChunk,
                prevChunk,
                setTotalChunks,
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
