import { describe, expect, it } from 'vitest';
import {
  parseJsonOutput,
  validateFrictionTriageDecision,
  validateOnboardingPathDecision,
  validateScopePolicyDecision,
  validateSessionPlanDecision,
} from '@/lib/ai-policy/validators';

describe('ai policy validators', () => {
  it('parses and validates session plan output', () => {
    const parsed = parseJsonOutput('{"selectedIds":["a","b"],"confidence":0.82,"reasonSummary":"Good fit"}');
    expect(parsed).not.toBeNull();
    const validated = validateSessionPlanDecision(parsed!);
    expect(validated?.output.selectedIds).toEqual(['a', 'b']);
    expect(validated?.confidence).toBe(0.82);
  });

  it('rejects malformed plan payloads', () => {
    const parsed = parseJsonOutput('{"selectedIds":"oops","confidence":0.8}');
    expect(parsed).not.toBeNull();
    expect(validateSessionPlanDecision(parsed!)).toBeNull();
  });

  it('validates scope caps within bounds', () => {
    const validated = validateScopePolicyDecision({
      maxItems: 9,
      maxMinutes: 2,
      confidence: 1.2,
      reasonSummary: 'test',
    });

    expect(validated?.output.maxItems).toBe(3);
    expect(validated?.output.maxMinutes).toBe(8);
    expect(validated?.confidence).toBe(1);
  });

  it('keeps onboarding target in allowed paths', () => {
    const validated = validateOnboardingPathDecision(
      {
        targetPath: '/weird',
        trackSlug: 'dsa',
        confidence: 0.75,
        reasonSummary: 'route',
      },
      ['/assessment', '/learn'],
      '/learn'
    );

    expect(validated?.output.targetPath).toBe('/learn');
    expect(validated?.output.trackSlug).toBe('dsa');
  });

  it('enforces triage owner candidates', () => {
    const validated = validateFrictionTriageDecision(
      {
        status: 'investigating',
        owner: 'unknown_owner',
        rationale: 'Signals suggest a sustained stuck pattern.',
        confidence: 0.71,
      },
      ['owner_a', 'owner_b']
    );

    expect(validated?.output.status).toBe('investigating');
    expect(validated?.output.owner).toBeNull();
    expect(validated?.confidence).toBe(0.71);
  });
});
