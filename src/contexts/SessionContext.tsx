'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession as useAuthSession } from 'next-auth/react';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { logTelemetryEvent } from '@/lib/telemetry';
import { createTransitionLock, type TransitionKind } from '@/lib/transition-lock';
import { useAdvanceItemAction } from '@/contexts/session-context/advance';
import { useFinalizeSessionActions } from '@/contexts/session-context/finalize';
import { useSessionFrictionTracking } from '@/contexts/session-context/friction';
import { useChunkNavigationActions } from '@/contexts/session-context/chunk-navigation';
import { loadPersistedSessionState, persistSessionState } from '@/contexts/session-context/storage';
import {
  initialState,
  type SessionContextValue,
  type SessionExecutionState,
  type SessionScope,
  type SessionState,
} from '@/contexts/session-context/types';

export type { SessionPhase, SessionScope, SessionExecutionState, SessionExitState, SessionState } from '@/contexts/session-context/types';

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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const restored = loadPersistedSessionState();
    if (restored) {
      setState(restored);
    }
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    persistSessionState(state);
  }, [state]);

  const isInSession = state.phase === 'execution';
  const frictionEnabled = isFeatureEnabled(FeatureFlags.FRICTION_INTELLIGENCE, authSession?.user ?? null);

  const {
    resetFrictionMonitorForStep,
    emitFrictionSnapshot,
    markInteraction,
  } = useSessionFrictionTracking({
    state,
    stateRef,
    frictionEnabled,
    authUserRole,
  });

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

  const advanceItem = useAdvanceItemAction({
    stateRef,
    setState,
    runWithTransitionLock,
    frictionEnabled,
    markInteraction,
    emitFrictionSnapshot,
    resetFrictionMonitorForStep,
    authUserRole,
    isMountedRef,
  });

  const { completeSession, abandonSession } = useFinalizeSessionActions({
    setState,
    runWithTransitionLock,
    frictionEnabled,
    emitFrictionSnapshot,
    authUserRole,
  });

  const resetToEntry = useCallback(() => {
    setState(initialState);
  }, []);

  const { nextChunk, prevChunk, setTotalChunks } = useChunkNavigationActions({
    stateRef,
    setState,
    frictionEnabled,
    markInteraction,
  });

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
