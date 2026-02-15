import { describe, expect, it } from 'vitest';
import {
  enforcePlanDiversity,
  highestTitleSimilarity,
  rankCandidatesHeuristically,
  type SessionPlannerCandidate,
} from '@/lib/session-llm-planner';
import type { SessionItem } from '@/lib/progress';

function makeItem(overrides: Partial<SessionItem> = {}): SessionItem {
  return {
    type: 'learn',
    title: 'Default Title',
    subtitle: '5 min read',
    pillarSlug: 'dsa',
    href: '/learn/dsa/default',
    estMinutes: 5,
    intent: {
      type: 'foundation',
      text: 'This builds core understanding because fundamentals matter for what comes next.',
    },
    confidence: 0.82,
    ...overrides,
  };
}

function makeCandidate(id: string, item: SessionItem): SessionPlannerCandidate {
  return { id, item };
}

describe('session planner quality', () => {
  it('computes high title similarity for near-duplicate activity titles', () => {
    const similarity = highestTitleSimilarity('Arrays two pointer drill', [
      'Arrays two-pointer deep dive',
      'Binary trees intro',
    ]);

    expect(similarity).toBeGreaterThan(0.5);
  });

  it('penalizes recent-activity title repeats in heuristic ranking', () => {
    const repeated = makeCandidate(
      'repeat',
      makeItem({
        title: 'Arrays two pointer drill',
        href: '/learn/dsa/arrays-two-pointer-drill',
      })
    );
    const fresh = makeCandidate(
      'fresh',
      makeItem({
        title: 'Heap invariants under pressure',
        href: '/learn/dsa/heap-invariants-under-pressure',
      })
    );

    const ranked = rankCandidatesHeuristically(
      [repeated, fresh],
      null,
      {
        completionRate: 0.7,
        timeAdherence: 0.7,
        nextDayReturnRate: 0.6,
        ritualQuality: 0.7,
      },
      ['Arrays two-pointer deep dive']
    );

    expect(ranked[0]?.id).toBe('fresh');
  });

  it('replaces duplicate-article selections when a diverse fallback exists', () => {
    const first = makeItem({
      title: 'Arrays intro',
      href: '/learn/dsa/arrays-intro',
      articleId: 'a1',
      primaryConceptSlug: 'arrays',
    });
    const duplicateArticle = makeItem({
      title: 'Arrays section: edge cases',
      href: '/learn/dsa/arrays-edge-cases',
      articleId: 'a1',
      primaryConceptSlug: 'arrays',
    });
    const diverseFallback = makeItem({
      title: 'Hash maps collision patterns',
      href: '/learn/dsa/hash-map-collision-patterns',
      articleId: 'a2',
      primaryConceptSlug: 'hash_maps',
    });

    const output = enforcePlanDiversity(
      [first, duplicateArticle],
      [
        makeCandidate('c1', first),
        makeCandidate('c2', duplicateArticle),
        makeCandidate('c3', diverseFallback),
      ],
      3,
      22
    );

    expect(output).toHaveLength(2);
    expect(output.some((item) => item.href === diverseFallback.href)).toBe(true);
  });
});

