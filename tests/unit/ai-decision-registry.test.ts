import { describe, expect, it } from 'vitest';
import { buildAIDecisionDedupeKey } from '@/lib/ai-decision-registry';

describe('ai decision registry', () => {
  it('builds deterministic dedupe keys', () => {
    const key = buildAIDecisionDedupeKey({
      decisionType: 'triage_recommendation',
      decisionMode: 'assist',
      trackSlug: 'system-design',
      stepIndex: 3,
      source: 'ai_recommendation',
      status: 'investigating',
      owner: 'Owner@Email.com',
      windowStartIso: '2026-02-16T13:47:22.000Z',
    });

    expect(key).toBe('ai:triage_recommendation:assist:system-design:3:ai_recommendation:investigating:owner_email.com:2026-02-16t13');
  });

  it('normalizes unknown segments safely', () => {
    const key = buildAIDecisionDedupeKey({
      decisionType: 'triage_brief',
      decisionMode: 'assist',
      trackSlug: 'DSA CORE',
      stepIndex: 1,
    });

    expect(key).toContain('ai:triage_brief:assist:dsa_core:1');
  });
});
