import type { FrictionSignalVector, FrictionSnapshotPayload, FrictionState, FrictionTrigger } from '@/types/friction';

export const FRICTION_EMIT_CONFIDENCE_THRESHOLD = 0.6;

export function buildFrictionDedupeKey(params: {
  sessionId: string;
  stepIndex: number;
  trigger: FrictionTrigger;
  frictionState: FrictionState;
}): string {
  const { sessionId, stepIndex, trigger, frictionState } = params;
  return `${sessionId}:${stepIndex}:${trigger}:${frictionState}`;
}

export function normalizeFrictionSnapshotPayload(params: {
  sessionId: string;
  trackSlug: string;
  stepIndex: number;
  frictionState: FrictionState;
  confidence: number;
  signals: FrictionSignalVector;
  trigger: FrictionTrigger;
}): FrictionSnapshotPayload {
  return {
    sessionId: params.sessionId,
    trackSlug: params.trackSlug,
    stepIndex: params.stepIndex,
    phase: 'execution',
    frictionState: params.frictionState,
    confidence: Math.max(0, Math.min(1, params.confidence)),
    signals: params.signals,
    trigger: params.trigger,
    dedupeKey: buildFrictionDedupeKey({
      sessionId: params.sessionId,
      stepIndex: params.stepIndex,
      trigger: params.trigger,
      frictionState: params.frictionState,
    }),
  };
}
