import type { SessionPersonalizationProfile } from '@/lib/session-personalization';

interface PlanItem {
  href: string;
  estMinutes: number | null;
}

export type PersonalizationScopeCohort = 'control' | 'treatment' | 'not_eligible';

export interface PersonalizationScopeExperiment {
  version: 'v1';
  cohort: PersonalizationScopeCohort;
  eligible: boolean;
  applied: boolean;
  maxItems: number;
  maxMinutes: number;
  baselineItemCount: number;
  baselineMinutes: number;
  finalItemCount: number;
  finalMinutes: number;
}

export function applyPersonalizationScopeExperiment(input: {
  userId: string;
  items: PlanItem[];
  profile: SessionPersonalizationProfile | null;
}): { items: PlanItem[]; experiment: PersonalizationScopeExperiment } {
  const baselineItems = input.items.slice(0, 3);
  const baselineMinutes = sumMinutes(baselineItems);
  const profile = input.profile;
  const eligible = Boolean(profile && (profile.segment === 'fragile' || profile.segment === 'at_risk'));
  const cohort = eligible ? assignEligibleCohort(input.userId) : 'not_eligible';
  const isTreatment = cohort === 'treatment';

  const maxItems = !eligible ? 3 : profile?.segment === 'at_risk' ? 1 : 2;
  const maxMinutes = !eligible ? 22 : profile?.segment === 'at_risk' ? 12 : 16;

  const finalItems = isTreatment
    ? trimByScope(baselineItems, { maxItems, maxMinutes })
    : baselineItems;

  return {
    items: finalItems,
    experiment: {
      version: 'v1',
      cohort,
      eligible,
      applied: isTreatment,
      maxItems,
      maxMinutes,
      baselineItemCount: baselineItems.length,
      baselineMinutes,
      finalItemCount: finalItems.length,
      finalMinutes: sumMinutes(finalItems),
    },
  };
}

function trimByScope(items: PlanItem[], limits: { maxItems: number; maxMinutes: number }): PlanItem[] {
  const selected: PlanItem[] = [];
  let usedMinutes = 0;

  for (const item of items) {
    if (selected.length >= limits.maxItems) break;
    const minutes = item.estMinutes ?? 5;
    if (selected.length > 0 && usedMinutes + minutes > limits.maxMinutes) {
      continue;
    }
    selected.push(item);
    usedMinutes += minutes;
  }

  if (selected.length === 0 && items[0]) {
    return [items[0]];
  }

  return selected;
}

function assignEligibleCohort(userId: string): Extract<PersonalizationScopeCohort, 'control' | 'treatment'> {
  const hash = simpleHash(`personalization-scope-v1:${userId}`);
  return hash % 2 === 0 ? 'control' : 'treatment';
}

function sumMinutes(items: PlanItem[]): number {
  return items.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0);
}

function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}
