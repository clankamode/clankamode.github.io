import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { SessionState } from '@/contexts/session-context/types';

export function useChunkNavigationActions(params: {
  stateRef: MutableRefObject<SessionState>;
  setState: Dispatch<SetStateAction<SessionState>>;
  frictionEnabled: boolean;
  markInteraction: (params: { chunkNext?: number; chunkPrev?: number; meaningfulAction?: number }) => void;
}) {
  const { stateRef, setState, frictionEnabled, markInteraction } = params;

  const nextChunk = useCallback(() => {
    const snapshot = stateRef.current;
    if (snapshot.phase !== 'execution' || !snapshot.execution) return;
    if (snapshot.transitionStatus !== 'ready' || snapshot.execution.transitionStatus !== 'ready') return;
    if (snapshot.execution.currentChunk >= snapshot.execution.totalChunks - 1) return;

    setState((prev) => {
      if (prev.phase !== 'execution' || !prev.execution) return prev;
      if (prev.transitionStatus !== 'ready' || prev.execution.transitionStatus !== 'ready') return prev;
      if (prev.execution.currentChunk >= prev.execution.totalChunks - 1) return prev;

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
  }, [frictionEnabled, markInteraction, setState, stateRef]);

  const prevChunk = useCallback(() => {
    const snapshot = stateRef.current;
    if (snapshot.phase !== 'execution' || !snapshot.execution) return;
    if (snapshot.transitionStatus !== 'ready' || snapshot.execution.transitionStatus !== 'ready') return;
    if (snapshot.execution.currentChunk <= 0) return;

    setState((prev) => {
      if (prev.phase !== 'execution' || !prev.execution) return prev;
      if (prev.transitionStatus !== 'ready' || prev.execution.transitionStatus !== 'ready') return prev;
      if (prev.execution.currentChunk <= 0) return prev;

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
  }, [frictionEnabled, markInteraction, setState, stateRef]);

  const setTotalChunks = useCallback((total: number) => {
    setState((prev) => {
      if (prev.phase !== 'execution' || !prev.execution) return prev;
      if (prev.transitionStatus !== 'ready' || prev.execution.transitionStatus !== 'ready') return prev;
      return {
        ...prev,
        execution: {
          ...prev.execution,
          totalChunks: Math.max(1, total),
        },
      };
    });
  }, [setState]);

  return { nextChunk, prevChunk, setTotalChunks };
}
