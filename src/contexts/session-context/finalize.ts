import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { microSessionProviderV0 } from '@/lib/session-micro';
import { proposeMicroSession } from '@/lib/micro-proposer';
import { STATIC_CONCEPT_INDEX } from '@/lib/concept-index';
import type { TransitionKind } from '@/lib/transition-lock';
import { getLastMicroConcept, setLastMicroConcept, toSessionProposal } from '@/contexts/session-context/storage';
import type { SessionState } from '@/contexts/session-context/types';

export function useFinalizeSessionActions(params: {
  setState: Dispatch<SetStateAction<SessionState>>;
  runWithTransitionLock: (kind: TransitionKind, operation: () => void) => boolean;
  frictionEnabled: boolean;
  emitFrictionSnapshot: (trigger: 'state_change' | 'step_exit', snapshot?: SessionState) => void;
  authUserRole?: string;
}) {
  const { setState, runWithTransitionLock, frictionEnabled, emitFrictionSnapshot, authUserRole } = params;

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

        const delta = { introduced: [], reinforced: [], unlocked: [] };

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
            microSessionProposal,
          },
          transitionStatus: 'ready',
        };
      });
    });
    if (acquired === false) {
      console.warn('[SessionContext] completeSession: lock not acquired — session not in execution phase or lock busy');
    }
  }, [authUserRole, emitFrictionSnapshot, frictionEnabled, runWithTransitionLock, setState]);

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
  }, [emitFrictionSnapshot, frictionEnabled, runWithTransitionLock, setState]);

  return { completeSession, abandonSession };
}
