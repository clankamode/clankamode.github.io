import { describe, expect, it } from 'vitest';
import { buildAIDecisionReplaySummary } from '@/lib/session-ai-replay';

describe('session ai replay summary', () => {
  it('aggregates across all decisions and computes override rates', () => {
    const decisions = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        created_at: '2026-02-16T10:00:00Z',
        decision_type: 'triage_recommendation',
        decision_mode: 'assist',
        track_slug: 'dsa',
        step_index: 2,
        actor_email: 'admin@example.com',
        confidence: 0.82,
        source: 'ai_recommendation',
        output_json: { appliedStatus: 'investigating', appliedOwner: 'alice@example.com' },
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        created_at: '2026-02-16T11:00:00Z',
        decision_type: 'triage_recommendation',
        decision_mode: 'assist',
        track_slug: 'dsa',
        step_index: 3,
        actor_email: 'admin@example.com',
        confidence: 0.76,
        source: 'ai_recommendation',
        output_json: { appliedStatus: 'new', appliedOwner: null },
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        created_at: '2026-02-16T12:00:00Z',
        decision_type: 'triage_brief',
        decision_mode: 'assist',
        track_slug: 'dsa',
        step_index: 4,
        actor_email: 'admin@example.com',
        confidence: 0.6,
        source: 'session_intelligence',
        output_json: { appliedStatus: 'investigating', appliedOwner: 'owner-1' },
      },
    ];

    const audits = [
      {
        created_at: '2026-02-16T10:30:00Z',
        action_type: 'manual_update',
        track_slug: 'dsa',
        step_index: 2,
        after_status: 'resolved',
        after_owner: 'alice@example.com',
      },
      {
        created_at: '2026-02-16T11:20:00Z',
        action_type: 'manual_update',
        track_slug: 'dsa',
        step_index: 3,
        after_status: 'new',
        after_owner: null,
      },
      {
        created_at: '2026-02-17T18:00:00Z',
        action_type: 'manual_update',
        track_slug: 'dsa',
        step_index: 4,
        after_status: 'resolved',
        after_owner: 'owner-2',
      },
    ];

    const summary = buildAIDecisionReplaySummary(decisions, audits, { recentLimit: 2 });
    const assistGroup = summary.groups.find(
      (group) => group.decisionType === 'triage_recommendation' && group.decisionMode === 'assist'
    );

    expect(summary.totalDecisions).toBe(3);
    expect(summary.recent).toHaveLength(2);
    expect(assistGroup?.total).toBe(2);
    expect(assistGroup?.overrides).toBe(1);
    expect(assistGroup?.overrideRate).toBeCloseTo(0.5, 5);
    expect(summary.sources.length).toBeGreaterThan(0);
    expect(summary.hotspots.length).toBeGreaterThan(0);
    expect(summary.confidence.average).not.toBeNull();
    expect(summary.outcomes.confirmed + summary.outcomes.overridden + summary.outcomes.unreviewed).toBe(3);
    expect(summary.reviewLatency.sampleCount).toBeGreaterThan(0);
    expect(summary.calibration.length).toBe(4);
  });

  it('treats owner/status mismatches within 24h as overrides', () => {
    const decisions = [
      {
        id: '00000000-0000-0000-0000-000000000011',
        created_at: '2026-02-16T10:00:00Z',
        decision_type: 'triage_recommendation',
        decision_mode: 'auto',
        track_slug: 'system-design',
        step_index: 1,
        actor_email: 'admin@example.com',
        confidence: 0.91,
        source: 'ai_auto_batch',
        output_json: { appliedStatus: 'investigating', appliedOwner: null },
      },
    ];

    const audits = [
      {
        created_at: '2026-02-16T10:05:00Z',
        action_type: 'manual_update',
        track_slug: 'system-design',
        step_index: 1,
        after_status: 'investigating',
        after_owner: 'bob@example.com',
      },
    ];

    const summary = buildAIDecisionReplaySummary(decisions, audits);
    expect(summary.recent[0]?.overriddenWithin24h).toBe(true);
    expect(summary.recent[0]?.reviewOutcome).toBe('overridden');
    expect(summary.recent[0]?.minutesToFirstManualUpdate).toBeCloseTo(5, 1);
    expect(summary.groups[0]?.overrides).toBe(1);
  });

  it('applies decision filters before aggregation', () => {
    const decisions = [
      {
        id: '00000000-0000-0000-0000-000000000021',
        created_at: '2026-02-16T10:00:00Z',
        decision_type: 'triage_brief',
        decision_mode: 'assist',
        track_slug: 'dsa',
        step_index: 1,
        actor_email: 'admin@example.com',
        confidence: 0.5,
        source: 'session_intelligence',
        output_json: { appliedStatus: 'new', appliedOwner: null },
      },
      {
        id: '00000000-0000-0000-0000-000000000022',
        created_at: '2026-02-16T11:00:00Z',
        decision_type: 'triage_recommendation',
        decision_mode: 'auto',
        track_slug: 'dsa',
        step_index: 1,
        actor_email: 'admin@example.com',
        confidence: 0.9,
        source: 'ai_auto_batch',
        output_json: { appliedStatus: 'investigating', appliedOwner: null },
      },
    ];

    const summary = buildAIDecisionReplaySummary(decisions, [], {
      decisionType: 'triage_recommendation',
      decisionMode: 'auto',
      source: 'ai_auto_batch',
    });

    expect(summary.totalDecisions).toBe(1);
    expect(summary.groups[0]?.decisionType).toBe('triage_recommendation');
    expect(summary.groups[0]?.decisionMode).toBe('auto');
    expect(summary.recent[0]?.source).toBe('ai_auto_batch');
  });

  it('emits calibration and feedback-loop insights for poor quality windows', () => {
    const baseDecisionTime = Date.parse('2026-02-16T10:00:00Z');
    const decisions = Array.from({ length: 12 }).map((_, i) => ({
      id: `00000000-0000-0000-0000-${String(i + 100).padStart(12, '0')}`,
      created_at: new Date(baseDecisionTime + i * 60 * 60 * 1000).toISOString(),
      decision_type: 'triage_recommendation',
      decision_mode: 'assist',
      track_slug: 'dsa',
      step_index: i % 3,
      actor_email: 'admin@example.com',
      confidence: i < 6 ? 0.9 : 0.45,
      source: 'ai_recommendation',
      output_json: { appliedStatus: 'investigating', appliedOwner: null },
    }));

    const baseAuditTime = Date.parse('2026-02-16T16:30:00Z');
    const audits = Array.from({ length: 12 }).map((_, i) => ({
      created_at: new Date(baseAuditTime + i * 60 * 60 * 1000).toISOString(),
      action_type: 'manual_update',
      track_slug: 'dsa',
      step_index: i % 3,
      after_status: i < 8 ? 'resolved' : 'investigating',
      after_owner: null,
    }));

    const summary = buildAIDecisionReplaySummary(decisions, audits);
    expect(summary.insights.length).toBeGreaterThan(0);
    expect(summary.outcomes.overriddenRate).toBeGreaterThan(0.35);
  });

  it('prefers explicit review labels over inferred manual diff outcome', () => {
    const decisions = [
      {
        id: '00000000-0000-0000-0000-000000000031',
        created_at: '2026-02-16T10:00:00Z',
        decision_type: 'triage_recommendation',
        decision_mode: 'assist',
        track_slug: 'dsa',
        step_index: 1,
        actor_email: 'admin@example.com',
        confidence: 0.88,
        source: 'ai_recommendation',
        output_json: {
          appliedStatus: 'investigating',
          appliedOwner: 'owner-a',
          reviewLabel: 'confirmed',
          reviewedBy: 'reviewer@example.com',
          reviewedAt: '2026-02-16T10:10:00Z',
        },
      },
    ];

    const audits = [
      {
        created_at: '2026-02-16T10:20:00Z',
        action_type: 'manual_update',
        track_slug: 'dsa',
        step_index: 1,
        after_status: 'resolved',
        after_owner: 'owner-b',
      },
    ];

    const summary = buildAIDecisionReplaySummary(decisions, audits);
    expect(summary.recent[0]?.overriddenWithin24h).toBe(true);
    expect(summary.recent[0]?.reviewOutcome).toBe('confirmed');
    expect(summary.outcomes.confirmed).toBe(1);
    expect(summary.outcomes.overridden).toBe(0);
  });
});
