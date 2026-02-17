import { describe, expect, it } from 'vitest';
import { applySessionPlanPolicySelection } from '@/lib/session-llm-planner';

const learnCandidate = {
  id: 'learn:a',
  item: {
    type: 'learn' as const,
    title: 'Arrays',
    subtitle: '5 min read',
    pillarSlug: 'dsa',
    href: '/learn/dsa/arrays',
    estMinutes: 5,
    intent: {
      type: 'foundation' as const,
      text: 'Build array indexing intuition because it underpins contiguous memory decisions.',
    },
    targetConcept: 'Array indexing',
  },
};

const practiceCandidate = {
  id: 'practice:1',
  item: {
    type: 'practice' as const,
    title: 'Two Sum',
    subtitle: 'Easy coding assessment',
    pillarSlug: 'dsa',
    href: '/session/practice/1',
    estMinutes: 10,
    intent: {
      type: 'practice' as const,
      text: 'Do timed retrieval because applied reps increase transfer speed.',
    },
    targetConcept: 'Hash map lookup',
  },
};

describe('session plan policy adapter', () => {
  it('maps selected ids into session items', () => {
    const result = applySessionPlanPolicySelection({
      selectedIds: ['learn:a', 'practice:1'],
      candidates: [learnCandidate, practiceCandidate],
      maxItems: 3,
      requirePracticeItem: false,
    });

    expect(result.map((item) => item.href)).toEqual(['/learn/dsa/arrays', '/session/practice/1']);
  });

  it('enforces practice inclusion when required', () => {
    const result = applySessionPlanPolicySelection({
      selectedIds: ['learn:a'],
      candidates: [learnCandidate, practiceCandidate],
      maxItems: 3,
      requirePracticeItem: true,
    });

    expect(result.some((item) => item.type === 'practice')).toBe(true);
  });
});
