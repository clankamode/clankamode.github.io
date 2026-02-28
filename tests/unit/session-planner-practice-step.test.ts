import { describe, expect, it } from 'vitest';
import { appendPracticeStepToPlan } from '@/lib/session-llm-planner';
import type { SessionItem } from '@/lib/progress';

function makeLearnItem(overrides: Partial<SessionItem> = {}): SessionItem {
  return {
    type: 'learn',
    title: 'Binary Search Foundations',
    subtitle: '6 min read',
    pillarSlug: 'dsa',
    href: '/learn/dsa/binary-search-foundations',
    articleId: 'article-1',
    estMinutes: 6,
    intent: {
      type: 'foundation',
      text: 'Build this now because fast interval narrowing is a core interview primitive.',
    },
    primaryConceptSlug: 'binary_search',
    targetConcept: 'Binary search',
    ...overrides,
  };
}

describe('session planner practice step', () => {
  it('appends one practice step after the final learn step when a question exists', () => {
    const first = makeLearnItem();
    const second = makeLearnItem({
      title: 'Binary Search Edge Cases',
      href: '/learn/dsa/binary-search-edge-cases',
      articleId: 'article-2',
    });

    const result = appendPracticeStepToPlan(
      [first, second],
      second,
      {
        id: 'q-123',
        name: 'Binary Search',
        difficulty: 'Easy',
      }
    );

    expect(result).toHaveLength(3);
    expect(result[2]?.type).toBe('practice');
    expect(result[2]?.questionId).toBe('q-123');
    expect(result[2]?.questionName).toBe('Binary Search');
    expect(result[2]?.estimatedMinutes).toBe(5);
    expect(result[2]?.estMinutes).toBe(5);
    expect(result[2]?.href).toContain('/code-editor/practice/q-123');
  });

  it('returns only learn steps when no concept-linked question exists', () => {
    const learn = makeLearnItem();
    const result = appendPracticeStepToPlan([learn], learn, null);

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe('learn');
  });
});
