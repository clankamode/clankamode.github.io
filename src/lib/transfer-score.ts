export type TransferHealthStatus = 'promote' | 'hold' | 'rollback';

export interface TransferTelemetryRow {
  email: string;
  google_id: string | null;
  session_id: string;
  created_at: string;
  payload: Record<string, unknown> | null;
}

export interface TransferScoreThresholds {
  promoteMinScore: number;
  promoteMinProofCoverage: number;
  promoteMaxRepeatFailureLoopRate: number;
  rollbackMaxScore: number;
  rollbackMinProofCoverage: number;
  rollbackMinRepeatFailureLoopRate: number;
}

export interface TransferScoreResult {
  transferScore: number;
  qualityAdjustedCompletion: number;
  finalizedRate: number;
  proofCoverage: number;
  nextDayContinuationQuality: number;
  repeatFailureLoopRate: number;
  blockedEventCount: number;
  committedSessions: number;
  finalizedSessions: number;
  status: TransferHealthStatus;
  reasons: string[];
  thresholds: TransferScoreThresholds;
  topRepeatedFailureQuestions: Array<{
    questionId: string;
    repeatedUsers: number;
    totalUsers: number;
    repeatRate: number;
  }>;
}

const TRANSFER_SCORE_THRESHOLDS: TransferScoreThresholds = {
  promoteMinScore: 0.6,
  promoteMinProofCoverage: 0.55,
  promoteMaxRepeatFailureLoopRate: 0.3,
  rollbackMaxScore: 0.45,
  rollbackMinProofCoverage: 0.3,
  rollbackMinRepeatFailureLoopRate: 0.45,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function dayKey(isoDate: string): string {
  return new Date(isoDate).toISOString().slice(0, 10);
}

function userKey(email: string, googleId: string | null): string {
  return googleId ? `${email}:${googleId}` : email;
}

function parseQuestionId(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const questionId = payload.questionId;
  return typeof questionId === 'string' && questionId.length > 0 ? questionId : null;
}

export function buildTransferScoreV0(params: {
  committedRows: TransferTelemetryRow[];
  finalizedRows: TransferTelemetryRow[];
  ritualRows: TransferTelemetryRow[];
  blockedRows: TransferTelemetryRow[];
}): TransferScoreResult {
  const { committedRows, finalizedRows, ritualRows, blockedRows } = params;

  const committedSessions = new Set(committedRows.map((row) => row.session_id));
  const finalizedSessions = new Set(finalizedRows.map((row) => row.session_id));
  const finalizedRate = committedSessions.size > 0 ? finalizedSessions.size / committedSessions.size : 0;

  const ritualBySession = new Set(ritualRows.map((row) => row.session_id));
  const finalizedWithRitual = Array.from(finalizedSessions).filter((sessionId) => ritualBySession.has(sessionId)).length;
  const proofCoverage = finalizedSessions.size > 0 ? finalizedWithRitual / finalizedSessions.size : 0;

  const committedUserDays = new Set(
    committedRows.map((row) => `${userKey(row.email, row.google_id)}::${dayKey(row.created_at)}`)
  );
  const finalizedUserDays = new Set(
    finalizedRows.map((row) => `${userKey(row.email, row.google_id)}::${dayKey(row.created_at)}`)
  );
  let resumedNextDayCount = 0;
  for (const entry of finalizedUserDays) {
    const [user, date] = entry.split('::');
    const nextDay = new Date(`${date}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const nextKey = `${user}::${nextDay.toISOString().slice(0, 10)}`;
    if (committedUserDays.has(nextKey)) {
      resumedNextDayCount += 1;
    }
  }
  const nextDayContinuationQuality = finalizedUserDays.size > 0 ? resumedNextDayCount / finalizedUserDays.size : 0;

  const blockedByUserQuestion = new Map<string, number>();
  for (const row of blockedRows) {
    const questionId = parseQuestionId(row.payload);
    if (!questionId) continue;
    const key = `${userKey(row.email, row.google_id)}::${questionId}`;
    blockedByUserQuestion.set(key, (blockedByUserQuestion.get(key) || 0) + 1);
  }

  const blockedKeys = Array.from(blockedByUserQuestion.entries());
  const repeatedFailurePairs = blockedKeys.filter(([, count]) => count >= 2).length;
  const repeatFailureLoopRate = blockedKeys.length > 0 ? repeatedFailurePairs / blockedKeys.length : 0;

  const questionRepeatMap = new Map<string, { repeatedUsers: number; totalUsersSet: Set<string> }>();
  for (const [key, count] of blockedKeys) {
    const [user, questionId] = key.split('::');
    const current = questionRepeatMap.get(questionId) || { repeatedUsers: 0, totalUsersSet: new Set<string>() };
    current.totalUsersSet.add(user);
    if (count >= 2) {
      current.repeatedUsers += 1;
    }
    questionRepeatMap.set(questionId, current);
  }

  const topRepeatedFailureQuestions = Array.from(questionRepeatMap.entries())
    .map(([questionId, value]) => {
      const totalUsers = value.totalUsersSet.size;
      return {
        questionId,
        repeatedUsers: value.repeatedUsers,
        totalUsers,
        repeatRate: totalUsers > 0 ? value.repeatedUsers / totalUsers : 0,
      };
    })
    .filter((row) => row.totalUsers > 0)
    .sort((a, b) => {
      if (b.repeatRate !== a.repeatRate) return b.repeatRate - a.repeatRate;
      return b.repeatedUsers - a.repeatedUsers;
    })
    .slice(0, 10);

  const qualityAdjustedCompletion = clamp01(
    finalizedRate *
      (0.5 + 0.25 * proofCoverage + 0.25 * nextDayContinuationQuality) *
      (1 - 0.4 * repeatFailureLoopRate)
  );

  const transferScore = clamp01(
    0.4 * nextDayContinuationQuality +
      0.35 * (1 - repeatFailureLoopRate) +
      0.25 * proofCoverage
  );

  let status: TransferHealthStatus = 'hold';
  const reasons: string[] = [];

  if (
    transferScore >= TRANSFER_SCORE_THRESHOLDS.promoteMinScore &&
    proofCoverage >= TRANSFER_SCORE_THRESHOLDS.promoteMinProofCoverage &&
    repeatFailureLoopRate <= TRANSFER_SCORE_THRESHOLDS.promoteMaxRepeatFailureLoopRate
  ) {
    status = 'promote';
    reasons.push('Primary transfer score and guardrails meet promotion thresholds.');
  } else if (
    transferScore < TRANSFER_SCORE_THRESHOLDS.rollbackMaxScore ||
    proofCoverage < TRANSFER_SCORE_THRESHOLDS.rollbackMinProofCoverage ||
    repeatFailureLoopRate > TRANSFER_SCORE_THRESHOLDS.rollbackMinRepeatFailureLoopRate
  ) {
    status = 'rollback';
    reasons.push('One or more rollback thresholds breached.');
  } else {
    reasons.push('Hold cohort and continue measurement; thresholds are mixed.');
  }

  return {
    transferScore,
    qualityAdjustedCompletion,
    finalizedRate,
    proofCoverage,
    nextDayContinuationQuality,
    repeatFailureLoopRate,
    blockedEventCount: blockedRows.length,
    committedSessions: committedSessions.size,
    finalizedSessions: finalizedSessions.size,
    status,
    reasons,
    thresholds: TRANSFER_SCORE_THRESHOLDS,
    topRepeatedFailureQuestions,
  };
}
