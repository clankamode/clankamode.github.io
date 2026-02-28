import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { classifyFriction } from '@/lib/friction-classifier';
import { logFrictionSnapshotAction } from '@/app/actions/friction';
import { FRICTION_EMIT_CONFIDENCE_THRESHOLD, normalizeFrictionSnapshotPayload } from '@/lib/friction-snapshot';
import { logTelemetryEvent } from '@/lib/telemetry';
import type { FrictionSignalVector, FrictionState, FrictionTrigger } from '@/types/friction';
import {
  PRACTICE_BLOCKED_EVENT_NAME,
  type SessionState,
} from '@/contexts/session-context/types';

export function useSessionFrictionTracking(params: {
  state: SessionState;
  stateRef: MutableRefObject<SessionState>;
  frictionEnabled: boolean;
  authUserRole?: string;
}) {
  const { state, stateRef, frictionEnabled, authUserRole } = params;
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
  }, [authUserRole, buildFrictionSignalVector, frictionEnabled, stateRef]);

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
  }, [frictionEnabled, markInteraction, stateRef]);

  return {
    resetFrictionMonitorForStep,
    emitFrictionSnapshot,
    markInteraction,
  };
}
