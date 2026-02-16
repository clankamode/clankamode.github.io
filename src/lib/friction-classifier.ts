import type { FrictionClassification, FrictionSignalVector } from '@/types/friction';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function classifyFriction(input: FrictionSignalVector): FrictionClassification {
  const estimatedMs = Math.max(input.estimatedMs, 60_000);
  const elapsedRatio = input.elapsedMs / estimatedMs;
  const oscillation = input.chunkNextCount + input.chunkPrevCount;
  const lowMeaningfulActions = input.meaningfulActionCount <= 2;
  const cadenceDrop = input.cadenceDrop || input.secondsSinceLastInteraction >= 120;

  if (input.practiceBlockedCount >= 2 || (oscillation >= 8 && lowMeaningfulActions)) {
    let confidence = 0.45;
    confidence += 0.2;
    if (input.practiceBlockedCount >= 3) confidence += 0.16;
    if (oscillation >= 10) confidence += 0.12;
    if (lowMeaningfulActions) confidence += 0.08;
    return {
      state: 'stuck',
      confidence: clamp01(confidence),
      reasons: [
        input.practiceBlockedCount >= 2 ? 'repeated_practice_block' : 'high_navigation_oscillation',
        lowMeaningfulActions ? 'low_meaningful_progress' : 'interaction_present',
      ],
    };
  }

  if (elapsedRatio > 2.2 && cadenceDrop) {
    let confidence = 0.45;
    confidence += 0.16;
    if (elapsedRatio > 2.8) confidence += 0.14;
    if (input.secondsSinceLastInteraction >= 180) confidence += 0.12;
    return {
      state: 'fatigue',
      confidence: clamp01(confidence),
      reasons: ['elapsed_ratio_high', 'interaction_cadence_drop'],
    };
  }

  if (elapsedRatio > 1.8 && lowMeaningfulActions) {
    let confidence = 0.45;
    confidence += 0.15;
    if (elapsedRatio > 2.2) confidence += 0.1;
    if (oscillation <= 3) confidence += 0.05;
    return {
      state: 'drift',
      confidence: clamp01(confidence),
      reasons: ['elapsed_ratio_over_budget', 'low_meaningful_progress'],
    };
  }

  if (elapsedRatio < 0.45 && input.practiceBlockedCount === 0 && input.meaningfulActionCount >= 2) {
    let confidence = 0.45;
    confidence += 0.13;
    if (elapsedRatio < 0.3) confidence += 0.12;
    if (input.meaningfulActionCount >= 4) confidence += 0.07;
    return {
      state: 'coast',
      confidence: clamp01(confidence),
      reasons: ['fast_progress', 'no_blockers'],
    };
  }

  let flowConfidence = 0.45;
  if (elapsedRatio >= 0.6 && elapsedRatio <= 1.4) flowConfidence += 0.12;
  if (input.meaningfulActionCount >= 1) flowConfidence += 0.05;
  if (input.practiceBlockedCount === 0) flowConfidence += 0.04;

  return {
    state: 'flow',
    confidence: clamp01(flowConfidence),
    reasons: ['balanced_progress'],
  };
}
