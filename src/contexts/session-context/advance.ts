import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { microSessionProviderV0, type MicroSessionProposal } from '@/lib/session-micro';
import { deriveLearningDelta, resolveDeltaLabels, fetchConceptDictionary, updateUserConceptStats } from '@/lib/delta-derivation';
import { proposeMicroSession } from '@/lib/micro-proposer';
import { STATIC_CONCEPT_INDEX } from '@/lib/concept-index';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { getUserLearningState } from '@/lib/user-learning-state';
import { logTelemetryEvent } from '@/lib/telemetry';
import type { TransitionKind } from '@/lib/transition-lock';
import type { LearningDelta } from '@/lib/progress';
import { getLastMicroConcept, setLastMicroConcept, toSessionProposal } from '@/contexts/session-context/storage';
import type { SessionState } from '@/contexts/session-context/types';

export function useAdvanceItemAction(params: {
  stateRef: MutableRefObject<SessionState>;
  setState: Dispatch<SetStateAction<SessionState>>;
  runWithTransitionLock: (kind: TransitionKind, operation: () => void) => boolean;
  frictionEnabled: boolean;
  markInteraction: (params: { meaningfulAction?: number }) => void;
  emitFrictionSnapshot: (trigger: 'state_change' | 'step_exit', snapshot?: SessionState) => void;
  resetFrictionMonitorForStep: (stepIndex: number) => void;
  authUserRole?: string;
  isMountedRef: MutableRefObject<boolean>;
}) {
  const {
    stateRef,
    setState,
    runWithTransitionLock,
    frictionEnabled,
    markInteraction,
    emitFrictionSnapshot,
    resetFrictionMonitorForStep,
    authUserRole,
    isMountedRef,
  } = params;

  return useCallback(() => {
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
            index: prev.execution.currentIndex,
          },
          dedupeKey: `completed_${prev.execution.sessionId}_${currentItem.href}`,
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
          unlocked: [],
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
            delta: currentDelta,
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
                delta: labeledDelta,
              });
            }

            if (!isMountedRef.current) return;

            setState((prevState) => {
              if (prevState.phase !== 'exit' || !prevState.exit) return prevState;
              return {
                ...prevState,
                exit: {
                  ...prevState.exit,
                  delta: labeledDelta,
                  rawDelta: result.delta,
                  primaryConcept: scope.items[0]?.primaryConceptSlug || null,
                  microSessionProposal: freshProposal,
                },
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
  }, [
    authUserRole,
    emitFrictionSnapshot,
    frictionEnabled,
    isMountedRef,
    markInteraction,
    resetFrictionMonitorForStep,
    runWithTransitionLock,
    setState,
    stateRef,
  ]);
}
