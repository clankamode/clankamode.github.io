export type FrictionState = 'flow' | 'stuck' | 'drift' | 'fatigue' | 'coast';

export type FrictionTrigger = 'state_change' | 'step_exit';

export interface FrictionSignalVector {
  stepIndex: number;
  elapsedMs: number;
  estimatedMs: number;
  chunkNextCount: number;
  chunkPrevCount: number;
  drawerToggleCount: number;
  practiceBlockedCount: number;
  meaningfulActionCount: number;
  secondsSinceLastInteraction: number;
  cadenceDrop: boolean;
}

export interface FrictionClassification {
  state: FrictionState;
  confidence: number;
  reasons: string[];
}

export interface FrictionSnapshotPayload {
  sessionId: string;
  trackSlug: string;
  stepIndex: number;
  phase: 'execution';
  frictionState: FrictionState;
  confidence: number;
  signals: FrictionSignalVector;
  trigger: FrictionTrigger;
  dedupeKey: string;
}
