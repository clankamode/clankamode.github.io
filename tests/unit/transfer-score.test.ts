import { describe, expect, it } from 'vitest';
import { buildTransferScoreV0, type TransferTelemetryRow } from '@/lib/transfer-score';

function row(input: Partial<TransferTelemetryRow> & Pick<TransferTelemetryRow, 'email' | 'session_id' | 'created_at'>): TransferTelemetryRow {
  return {
    email: input.email,
    google_id: input.google_id ?? null,
    session_id: input.session_id,
    created_at: input.created_at,
    payload: input.payload ?? null,
  };
}

describe('transfer score v0', () => {
  it('promotes healthy cohorts with strong continuation, proof, and low repeat loops', () => {
    const committedRows = [
      row({ email: 'a@example.com', session_id: 's1', created_at: '2026-02-10T10:00:00Z' }),
      row({ email: 'a@example.com', session_id: 's2', created_at: '2026-02-11T10:00:00Z' }),
      row({ email: 'b@example.com', session_id: 's3', created_at: '2026-02-10T09:00:00Z' }),
      row({ email: 'b@example.com', session_id: 's4', created_at: '2026-02-11T09:00:00Z' }),
    ];
    const finalizedRows = [
      row({ email: 'a@example.com', session_id: 's1', created_at: '2026-02-10T10:30:00Z' }),
      row({ email: 'b@example.com', session_id: 's3', created_at: '2026-02-10T09:30:00Z' }),
    ];
    const ritualRows = [
      row({ email: 'a@example.com', session_id: 's1', created_at: '2026-02-10T10:32:00Z' }),
      row({ email: 'b@example.com', session_id: 's3', created_at: '2026-02-10T09:32:00Z' }),
    ];

    const result = buildTransferScoreV0({
      committedRows,
      finalizedRows,
      ritualRows,
      blockedRows: [],
    });

    expect(result.status).toBe('promote');
    expect(result.transferScore).toBeGreaterThanOrEqual(0.6);
    expect(result.proofCoverage).toBe(1);
    expect(result.repeatFailureLoopRate).toBe(0);
  });

  it('rolls back when repeat failure loops are high and proof is missing', () => {
    const committedRows = [
      row({ email: 'a@example.com', session_id: 's1', created_at: '2026-02-10T10:00:00Z' }),
      row({ email: 'a@example.com', session_id: 's2', created_at: '2026-02-11T10:00:00Z' }),
    ];
    const finalizedRows = [
      row({ email: 'a@example.com', session_id: 's1', created_at: '2026-02-10T10:30:00Z' }),
    ];
    const blockedRows = [
      row({ email: 'a@example.com', session_id: 's1', created_at: '2026-02-10T10:05:00Z', payload: { questionId: '1' } }),
      row({ email: 'a@example.com', session_id: 's2', created_at: '2026-02-11T10:05:00Z', payload: { questionId: '1' } }),
      row({ email: 'a@example.com', session_id: 's3', created_at: '2026-02-11T10:06:00Z', payload: { questionId: '2' } }),
      row({ email: 'a@example.com', session_id: 's4', created_at: '2026-02-11T10:07:00Z', payload: { questionId: '2' } }),
    ];

    const result = buildTransferScoreV0({
      committedRows,
      finalizedRows,
      ritualRows: [],
      blockedRows,
    });

    expect(result.status).toBe('rollback');
    expect(result.proofCoverage).toBe(0);
    expect(result.repeatFailureLoopRate).toBe(1);
    expect(result.topRepeatedFailureQuestions[0]?.questionId).toBe('1');
  });
});
