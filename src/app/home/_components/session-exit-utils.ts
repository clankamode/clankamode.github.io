import type { SessionItem } from '@/lib/progress';
import type { MicroSessionProposal } from '@/lib/session-micro';

export type MicroFollowUpKind = 'article' | 'exercise';

export interface MicroFollowUpPresentation {
  kind: MicroFollowUpKind;
  heading: string;
  badge: string;
  ctaLabel: string;
}

export function getMicroFollowUpKind(proposal: MicroSessionProposal | null | undefined): MicroFollowUpKind {
  const primaryType = proposal?.items?.[0]?.type;
  return primaryType === 'article' ? 'article' : 'exercise';
}

export function getMicroFollowUpPresentation(
  proposal: MicroSessionProposal | null | undefined
): MicroFollowUpPresentation {
  const kind = getMicroFollowUpKind(proposal);
  if (kind === 'article') {
    return {
      kind,
      heading: 'Up next',
      badge: 'Article',
      ctaLabel: 'Open article',
    };
  }

  return {
    kind,
    heading: 'Next practice',
    badge: 'Practice Drill',
    ctaLabel: 'Begin Practice',
  };
}

export function buildMicroSessionItems(
  proposal: MicroSessionProposal,
  trackSlug: string
): SessionItem[] {
  return proposal.items.map((item) => ({
    type: item.type === 'article' ? 'learn' : 'practice',
    title: item.title,
    subtitle: 'Micro-session',
    pillarSlug: trackSlug,
    href: item.href,
    estMinutes: proposal.estimatedMinutes,
    intent: proposal.intent,
  }));
}
