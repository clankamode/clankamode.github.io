import { describe, expect, it } from 'vitest';
import type { MicroSessionProposal } from '@/lib/session-micro';
import {
  buildMicroSessionItems,
  getMicroFollowUpPresentation,
} from '@/app/home/_components/session-exit-utils';

function makeProposal(itemType: 'article' | 'exercise'): MicroSessionProposal {
  return {
    id: 'micro-1',
    label: 'Next: Arrays (5 min)',
    estimatedMinutes: 5,
    intent: { type: 'practice', text: 'Reinforce array fluency.' },
    items: [
      {
        title: 'Arrays',
        href: itemType === 'article' ? '/learn/dsa/arrays' : '/session/practice/1',
        type: itemType,
      },
    ],
  };
}

describe('session-exit utils', () => {
  it('returns article follow-up copy when first proposal item is an article', () => {
    const presentation = getMicroFollowUpPresentation(makeProposal('article'));
    expect(presentation).toMatchObject({
      kind: 'article',
      heading: 'Up next',
      badge: 'Article',
      ctaLabel: 'Open article',
    });
  });

  it('returns practice follow-up copy when first proposal item is an exercise', () => {
    const presentation = getMicroFollowUpPresentation(makeProposal('exercise'));
    expect(presentation).toMatchObject({
      kind: 'exercise',
      heading: 'Next practice',
      badge: 'Practice Drill',
      ctaLabel: 'Begin Practice',
    });
  });

  it('maps micro proposal items to learn/practice session item types', () => {
    const articleItems = buildMicroSessionItems(makeProposal('article'), 'dsa');
    const exerciseItems = buildMicroSessionItems(makeProposal('exercise'), 'dsa');

    expect(articleItems[0]).toMatchObject({
      type: 'learn',
      subtitle: 'Micro-session',
      pillarSlug: 'dsa',
      href: '/learn/dsa/arrays',
    });

    expect(exerciseItems[0]).toMatchObject({
      type: 'practice',
      subtitle: 'Micro-session',
      pillarSlug: 'dsa',
      href: '/session/practice/1',
    });
  });
});
