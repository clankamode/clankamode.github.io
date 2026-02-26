'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession as useAuthSession } from 'next-auth/react';
import type { SessionItem, LearningDelta } from '@/lib/progress';
import type { SessionPersonalizationProfile } from '@/lib/session-personalization';
import type { PersonalizationScopeExperiment } from '@/lib/session-personalization-experiment';
import { type MicroSessionProposal, microSessionProviderV0 } from '@/lib/session-micro';
import { deriveLearningDelta, resolveDeltaLabels, fetchConceptDictionary, updateUserConceptStats } from '@/lib/delta-derivation';
import { proposeMicroSession } from '@/lib/micro-proposer';
import type { MicroProposal } from '@/types/micro';
import { STATIC_CONCEPT_INDEX } from '@/lib/concept-index';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { getUserLearningState } from '@/lib/user-learning-state';
import { logTelemetryEvent } from '@/lib/telemetry';
import { createTransitionLock, type TransitionKind } from '@/lib/transition-lock';
import { classifyFriction } from '@/lib/friction-classifier';
import { logFrictionSnapshotAction } from '@/app/actions/friction';
import { FRICTION_EMIT_CONFIDENCE_THRESHOLD, normalizeFrictionSnapshotPayload } from '@/lib/friction-snapshot';
import type { FrictionSignalVector, FrictionTrigger, FrictionState } from '@/types/friction';

export type SessionPhase = 'idle' | 'entry' | 'execution' | 'exit' | 'generating';
type SessionTransitionStatus = 'ready' | 'advancing' | 'finalizing';
const SESSION_STATE_STORAGE_KEY = 'session:state:v1';
const LAST_MICRO_CONCEPT_STORAGE_KEY = 'session:last-micro-concept:v1';
const PRACTICE_BLOCKED_EVENT_NAME = 'session:practice-blocked';

export interface SessionScope {
    track: { slug: string; name: string };
    items: SessionItem[];
    estimatedMinutes: number;
    exitCondition: string;
    userId?: string;
    googleId?: string;
    sessionId?: string;
    personalization?: SessionPersonalizationProfile | null;
    personalizationExperiment?: PersonalizationScopeExperiment | null;
    aiPolicyVersion?: string | null;
    planPolicyDecisionId?: string | null;
    scopePolicyDecisionId?: string | null;
    onboardingDecisionId?: string | null;
    policyFallbackUsed?: boolean;
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
    setGenerating: () => void;
    recordDrawerToggle: () => void;
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
    const { data: authSession } = useAuthSession();
    const authUserRole = (authSession?.user as { role?: string } | undefined)?.role;
    const isMountedRef = useRef(true);
    const transitionLockRef = useRef(createTransitionLock());
    const stepStartedAtRef = useRef<number | null>(null);
    const lastInteractionAtRef = useRef<number | null>(null);
    const chunkNextCountRef = useRef(0);
    const chunkPrevCountRef = useRef(0);
    const drawerToggleCountRef = useRef(0);
    const practiceBlockedCountRef = useRef(0);
    const meaningfulActionCountRef = useRef(0);
    const currentTrackedStepRef = useRef<number | null>(null);
    const previousFrictionStateRef = useRef<FrictionState | null>(null);
    const stepExitDedupeRef = useRef<string | null>(null);

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

            // Discard stale execution/exit state older than 4 hours to prevent
            // the navbar from being permanently hidden on fresh page loads.
            const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000;
            if (parsed.execution?.startedAt) {
                const age = Date.now() - new Date(parsed.execution.startedAt).getTime();
                if (age > SESSION_MAX_AGE_MS) {
                    window.sessionStorage.removeItem(SESSION_STATE_STORAGE_KEY);
                    return;
                }
            }

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
    const frictionEnabled = isFeatureEnabled(FeatureFlags.FRICTION_INTELLIGENCE, authSession?.user ?? null);

    const resetFrictionMonitorForStep = useCallback((stepIndex: number) => {
        const now = Date.now();
        stepStartedAtRef.current = now;
        lastInteractionAtRef.current = now;
        chunkNextCountRef.current = 0;
        chunkPrevCountRef.current = 0;
        drawerToggleCountRef.current = 0;
        practiceBlockedCountRef.current = 0;
        meaningfulActionCountRef.current = 0;
        currentTrackedStepRef.current = stepIndex;
        previousFrictionStateRef.current = null;
        stepExitDedupeRef.current = null;
    }, []);

    const buildFrictionSignalVector = useCallback((snapshot: SessionState): FrictionSignalVector | null => {
        if (snapshot.phase !== 'execution' || !snapshot.scope || !snapshot.execution) {
            return null;
        }

        const currentItem = snapshot.scope.items[snapshot.execution.currentIndex];
        const estimatedMinutes = Math.max(currentItem?.estMinutes ?? snapshot.scope.estimatedMinutes ?? 10, 1);
        const now = Date.now();
        const stepStartedAt = stepStartedAtRef.current ?? now;
        const lastInteractionAt = lastInteractionAtRef.current ?? stepStartedAt;
        const secondsSinceLastInteraction = Math.max(0, Math.round((now - lastInteractionAt) / 1000));

        return {
            stepIndex: snapshot.execution.currentIndex,
            elapsedMs: Math.max(0, now - stepStartedAt),
            estimatedMs: estimatedMinutes * 60_000,
            chunkNextCount: chunkNextCountRef.current,
            chunkPrevCount: chunkPrevCountRef.current,
            drawerToggleCount: drawerToggleCountRef.current,
            practiceBlockedCount: practiceBlockedCountRef.current,
            meaningfulActionCount: meaningfulActionCountRef.current,
            secondsSinceLastInteraction,
            cadenceDrop: secondsSinceLastInteraction >= 120,
        };
    }, []);

    const emitFrictionSnapshot = useCallback((trigger: FrictionTrigger, snapshot: SessionState = stateRef.current) => {
        if (!frictionEnabled || snapshot.phase !== 'execution' || !snapshot.scope || !snapshot.execution) {
            return;
        }

        const signals = buildFrictionSignalVector(snapshot);
        if (!signals) return;

        const classification = classifyFriction(signals);
        if (classification.confidence < FRICTION_EMIT_CONFIDENCE_THRESHOLD) return;

        if (trigger === 'state_change') {
            if (previousFrictionStateRef.current === null) {
                previousFrictionStateRef.current = classification.state;
                return;
            }
            if (previousFrictionStateRef.current === classification.state) {
                return;
            }
            previousFrictionStateRef.current = classification.state;
        }

        if (trigger === 'step_exit') {
            const stepExitKey = `${snapshot.execution.sessionId}:${snapshot.execution.currentIndex}`;
            if (stepExitDedupeRef.current === stepExitKey) {
                return;
            }
            stepExitDedupeRef.current = stepExitKey;
        }

        const payload = normalizeFrictionSnapshotPayload({
            sessionId: snapshot.execution.sessionId,
            trackSlug: snapshot.scope.track.slug,
            stepIndex: snapshot.execution.currentIndex,
            frictionState: classification.state,
            confidence: classification.confidence,
            signals,
            trigger,
        });

        logFrictionSnapshotAction(payload).catch((error) => {
            console.warn('[friction] snapshot action failed:', error);
        });

        if (!snapshot.scope.userId) {
            return;
        }

        logTelemetryEvent({
            userId: snapshot.scope.userId,
            userRole: authUserRole,
            trackSlug: snapshot.scope.track.slug,
            sessionId: snapshot.execution.sessionId,
            eventType: 'friction_state_changed',
            mode: 'execute',
            payload: {
                phase: 'execution',
                trigger,
                frictionState: classification.state,
                confidence: classification.confidence,
                reasons: classification.reasons,
                signals,
            },
            dedupeKey: payload.dedupeKey,
        }).catch((error) => {
            console.warn('[friction] telemetry emit failed:', error);
        });
    }, [authUserRole, buildFrictionSignalVector, frictionEnabled]);

    const markInteraction = useCallback((params: {
        chunkNext?: number;
        chunkPrev?: number;
        drawerToggle?: number;
        meaningfulAction?: number;
        practiceBlocked?: number;
    }) => {
        lastInteractionAtRef.current = Date.now();
        chunkNextCountRef.current += params.chunkNext ?? 0;
        chunkPrevCountRef.current += params.chunkPrev ?? 0;
        drawerToggleCountRef.current += params.drawerToggle ?? 0;
        meaningfulActionCountRef.current += params.meaningfulAction ?? 0;
        practiceBlockedCountRef.current += params.practiceBlocked ?? 0;
        emitFrictionSnapshot('state_change');
    }, [emitFrictionSnapshot]);

    useEffect(() => {
        if (state.phase === 'exit' && pathname !== '/home' && pathname !== '/learn/progress') {
            router.push('/home');
        }
    }, [state.phase, pathname, router]);

    useEffect(() => {
        if (!frictionEnabled || state.phase !== 'execution' || !state.execution) {
            return;
        }

        if (currentTrackedStepRef.current !== state.execution.currentIndex || stepStartedAtRef.current === null) {
            resetFrictionMonitorForStep(state.execution.currentIndex);
        }
    }, [frictionEnabled, resetFrictionMonitorForStep, state.execution, state.phase]);

    useEffect(() => {
        const onPracticeBlocked = (event: Event) => {
            if (!frictionEnabled) return;

            const current = stateRef.current;
            if (current.phase !== 'execution' || !current.execution) return;

            const customEvent = event as CustomEvent<{ sessionId?: string }>;
            if (customEvent.detail?.sessionId && customEvent.detail.sessionId !== current.execution.sessionId) {
                return;
            }

            markInteraction({ practiceBlocked: 1 });
        };

        window.addEventListener(PRACTICE_BLOCKED_EVENT_NAME, onPracticeBlocked);
        return () => {
            window.removeEventListener(PRACTICE_BLOCKED_EVENT_NAME, onPracticeBlocked);
        };
    }, [frictionEnabled, markInteraction]);

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
                userRole: authUserRole,
                trackSlug: scope.track.slug,
                sessionId,
                eventType: 'session_started',
                mode: 'execute',
                payload: {
                    itemCount: scope.items.length,
                    estimatedMinutes: scope.estimatedMinutes,
                    personalizationScore: scope.personalization?.score ?? null,
                    personalizationSegment: scope.personalization?.segment ?? null,
                    personalizationRecommendation: scope.personalization?.recommendation ?? null,
                    personalizationScopeCohort: scope.personalizationExperiment?.cohort ?? 'not_eligible',
                    personalizationScopeEligible: scope.personalizationExperiment?.eligible ?? false,
                    personalizationScopeApplied: scope.personalizationExperiment?.applied ?? false,
                    personalizationScopeMaxItems: scope.personalizationExperiment?.maxItems ?? null,
                    personalizationScopeMaxMinutes: scope.personalizationExperiment?.maxMinutes ?? null,
                    aiPolicyVersion: scope.aiPolicyVersion ?? null,
                    planDecisionId: scope.planPolicyDecisionId ?? null,
                    scopeDecisionId: scope.scopePolicyDecisionId ?? null,
                    onboardingDecisionId: scope.onboardingDecisionId ?? null,
                    policyFallbackUsed: scope.policyFallbackUsed ?? false,
                },
                dedupeKey: `session_started_${sessionId}`,
            });
        }

        if (frictionEnabled) {
            resetFrictionMonitorForStep(0);
        }

        setState({
            phase: 'execution',
            scope: { ...scope, sessionId },
            execution: executionState,
            exit: null,
            transitionStatus: 'ready',
        });
    }, [authUserRole, frictionEnabled, resetFrictionMonitorForStep]);

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
        const snapshot = stateRef.current;
        if (snapshot.phase !== 'execution' || !snapshot.execution || !snapshot.scope) {
            return false;
        }

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
        const acquired = runWithTransitionLock('advancing', () => {
            const prev = stateRef.current;
            if (!prev.execution || !prev.scope) return;
            if (frictionEnabled) {
                markInteraction({ meaningfulAction: 1 });
                emitFrictionSnapshot('step_exit', prev);
            }

            const currentItem = prev.scope.items[prev.execution.currentIndex];
            const newCompletedItems = [...prev.execution.completedItems, currentItem?.href || ''];
            const newIndex = prev.execution.currentIndex + 1;

            if (currentItem && prev.scope.userId) {
                logTelemetryEvent({
                    userId: prev.scope.userId,
                    userRole: authUserRole,
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
                    userRole: authUserRole,
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
                    const useV1 = isFeatureEnabled(FeatureFlags.USE_MICRO_V1, authUserRole ? { role: authUserRole } : null);
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

                        const useGenerative = isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS, authUserRole ? { role: authUserRole } : null) && !!userId;
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
                        } else if (isFeatureEnabled(FeatureFlags.USE_MICRO_V1, authUserRole ? { role: authUserRole } : null)) {
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

            if (frictionEnabled) {
                resetFrictionMonitorForStep(newIndex);
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
        if (acquired === false) {
            console.warn('[SessionContext] advanceItem: lock not acquired — session not in execution phase or lock busy');
        }
    }, [authUserRole, emitFrictionSnapshot, frictionEnabled, markInteraction, resetFrictionMonitorForStep, runWithTransitionLock]);

    const completeSession = useCallback(() => {
        const acquired = runWithTransitionLock('finalizing', () => {
            if (frictionEnabled) {
                emitFrictionSnapshot('step_exit');
            }
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

                const microSessionProposal = isFeatureEnabled(FeatureFlags.USE_MICRO_V1, authUserRole ? { role: authUserRole } : null)
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
        if (acquired === false) {
            console.warn('[SessionContext] completeSession: lock not acquired — session not in execution phase or lock busy');
        }
    }, [authUserRole, emitFrictionSnapshot, frictionEnabled, runWithTransitionLock]);

    const abandonSession = useCallback(() => {
        const acquired = runWithTransitionLock('finalizing', () => {
            if (frictionEnabled) {
                emitFrictionSnapshot('step_exit');
            }
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
        if (acquired === false) {
            console.warn('[SessionContext] abandonSession: lock not acquired — session not in execution phase or lock busy');
        }
    }, [emitFrictionSnapshot, frictionEnabled, runWithTransitionLock]);

    const resetToEntry = useCallback(() => {
        setState(initialState);
    }, []);

    const nextChunk = useCallback(() => {
        const snapshot = stateRef.current;
        if (snapshot.phase !== 'execution' || !snapshot.execution) {
            return;
        }
        if (snapshot.transitionStatus !== 'ready' || snapshot.execution.transitionStatus !== 'ready') {
            return;
        }
        if (snapshot.execution.currentChunk >= snapshot.execution.totalChunks - 1) {
            return;
        }

        setState((prev) => {
            if (prev.phase !== 'execution' || !prev.execution) {
                return prev;
            }
            if (prev.transitionStatus !== 'ready' || prev.execution.transitionStatus !== 'ready') {
                return prev;
            }
            if (prev.execution.currentChunk >= prev.execution.totalChunks - 1) {
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

        if (frictionEnabled) {
            markInteraction({ chunkNext: 1, meaningfulAction: 1 });
        }
    }, [frictionEnabled, markInteraction]);

    const prevChunk = useCallback(() => {
        const snapshot = stateRef.current;
        if (snapshot.phase !== 'execution' || !snapshot.execution) {
            return;
        }
        if (snapshot.transitionStatus !== 'ready' || snapshot.execution.transitionStatus !== 'ready') {
            return;
        }
        if (snapshot.execution.currentChunk <= 0) {
            return;
        }

        setState((prev) => {
            if (prev.phase !== 'execution' || !prev.execution) {
                return prev;
            }
            if (prev.transitionStatus !== 'ready' || prev.execution.transitionStatus !== 'ready') {
                return prev;
            }
            if (prev.execution.currentChunk <= 0) {
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

        if (frictionEnabled) {
            markInteraction({ chunkPrev: 1 });
        }
    }, [frictionEnabled, markInteraction]);

    const setTotalChunks = useCallback((total: number) => {
        setState((prev) => {
            if (prev.phase !== 'execution' || !prev.execution) return prev;
            if (prev.transitionStatus !== 'ready' || prev.execution.transitionStatus !== 'ready') {
                return prev;
            }
            return {
                ...prev,
                execution: {
                    ...prev.execution,
                    totalChunks: Math.max(1, total),
                },
            };
        });
    }, []);

    const setGenerating = useCallback(() => {
        setState((prev) => ({
            ...prev,
            phase: 'generating',
        }));
    }, []);

    const recordDrawerToggle = useCallback(() => {
        if (frictionEnabled) {
            markInteraction({ drawerToggle: 1 });
        }
    }, [frictionEnabled, markInteraction]);

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
                setGenerating,
                recordDrawerToggle,
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

export function useCurrentSessionItemTitle(): string | undefined {
    const context = useContext(SessionContext);
    if (!context) return undefined;

    const { state } = context;
    if (state.phase !== 'execution' || !state.scope || !state.execution) {
        return undefined;
    }

    return state.scope.items[state.execution.currentIndex]?.title;
}
