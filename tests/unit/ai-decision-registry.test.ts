import { describe, expect, it } from 'vitest';
import { buildAIDecisionDedupeKey } from '@/lib/ai-decision-registry';

describe('ai decision registry', () => {
  it('builds deterministic dedupe keys', () => {
    const key = buildAIDecisionDedupeKey({
      decisionType: 'triage_recommendation',
      decisionMode: 'assist',
      decisionScope: 'triage',
      trackSlug: 'system-design',
      stepIndex: 3,
      sessionId: 'sess-123',
      decisionTarget: 'system-design:3',
      source: 'ai_recommendation',
      status: 'investigating',
      owner: 'Owner@Email.com',
      windowStartIso: '2026-02-16T13:47:22.000Z',
    });

    expect(key).toBe('ai:triage_recommendation:assist:triage:system-design:3:sess-123:system-design_3:ai_recommendation:investigating:owner_email.com:2026-02-16t13');
  });

  it('normalizes unknown segments safely', () => {
    const key = buildAIDecisionDedupeKey({
      decisionType: 'session_plan',
      decisionMode: 'auto',
      decisionScope: 'planner',
      trackSlug: 'DSA CORE',
      stepIndex: null,
    });

    expect(key).toContain('ai:session_plan:auto:planner:dsa_core:na');
  });
});
