import type { SessionItem } from '@/lib/progress';
import type { SessionPlannerCandidate } from '@/lib/session-llm-planner/types';

export function enforceAtLeastOneLearn(
  selectedItems: SessionItem[],
  candidates: SessionPlannerCandidate[],
  maxItems: number
): SessionItem[] {
  const hasLearn = selectedItems.some((item) => item.type === 'learn');
  if (hasLearn) return selectedItems;

  const firstLearn = candidates.find((candidate) => candidate.item.type === 'learn')?.item;
  if (!firstLearn) return selectedItems;

  const next = [firstLearn, ...selectedItems];
  return next.slice(0, maxItems);
}

export function capTotalMinutes(items: SessionItem[], maxMinutes: number): SessionItem[] {
  const capped: SessionItem[] = [];
  let totalMinutes = 0;

  for (const item of items) {
    const minutes = item.estMinutes ?? 5;
    if (capped.length > 0 && totalMinutes + minutes > maxMinutes) {
      continue;
    }
    capped.push(item);
    totalMinutes += minutes;
  }

  return capped.slice(0, 3);
}

export function enforceAtLeastOnePractice(
  selectedItems: SessionItem[],
  candidates: SessionPlannerCandidate[],
  maxItems: number,
  maxMinutes: number
): SessionItem[] {
  if (selectedItems.some((item) => item.type === 'practice')) {
    return selectedItems;
  }

  const fallbackPractice = candidates.find((candidate) => candidate.item.type === 'practice')?.item;
  if (!fallbackPractice) return selectedItems;

  const currentMinutes = selectedItems.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0);
  const practiceMinutes = fallbackPractice.estMinutes ?? 5;

  if (selectedItems.length < maxItems && currentMinutes + practiceMinutes <= maxMinutes) {
    return [...selectedItems, fallbackPractice];
  }

  const mutable = [...selectedItems];
  while (
    mutable.length > 0 &&
    (mutable.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0) + practiceMinutes > maxMinutes || mutable.length >= maxItems)
  ) {
    mutable.pop();
  }

  return [...mutable, fallbackPractice].slice(0, maxItems);
}
