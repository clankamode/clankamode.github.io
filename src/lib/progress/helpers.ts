import type { LearningArticle, LearningPillarWithTopics } from '@/types/content';
import type { ArticleLookupEntry, SessionItem } from '@/lib/progress/types';

export function buildArticleLookup(library: LearningPillarWithTopics[]) {
  const lookup = new Map<string, ArticleLookupEntry>();

  library.forEach((pillar) => {
    pillar.topics.forEach((topic) => {
      topic.articles.forEach((article) => {
        lookup.set(article.id, { article, pillar });
      });
    });
  });

  return lookup;
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isWeekendUTC(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function getUTCWeekKey(date: Date): string {
  const weekStart = new Date(date);
  const day = weekStart.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - daysFromMonday);
  return getDateKey(weekStart);
}

export interface StreakOptions {
  freezeDates?: string[];
  freezeRecords?: StreakFreezeRecord[];
  weeklyFreezeLimit?: number;
  weekendOffEnabled?: boolean;
  today?: Date;
}

export interface StreakFreezeRecord {
  usedAt: string;
  type: 'manual' | 'weekend';
}

export interface StreakDayState {
  date: string;
  state: 'earned' | 'freeze';
  reason?: 'manual-freeze' | 'weekend-off';
}

export interface StreakStatus {
  streakDays: number;
  dayStates: StreakDayState[];
}

const STREAK_MILESTONES = [3, 7, 14, 30] as const;

export function getStreakStatus(completedAtDates: string[], options?: StreakOptions): StreakStatus {
  if (!completedAtDates.length) {
    return { streakDays: 0, dayStates: [] };
  }

  const completedKeys = new Set(
    completedAtDates.map((completedAt) => getDateKey(new Date(completedAt)))
  );
  const freezeReasonsByDate = new Map<string, StreakDayState['reason']>();
  for (const freezeDate of options?.freezeDates || []) {
    freezeReasonsByDate.set(getDateKey(new Date(freezeDate)), 'manual-freeze');
  }
  for (const freezeRecord of options?.freezeRecords || []) {
    freezeReasonsByDate.set(
      getDateKey(new Date(freezeRecord.usedAt)),
      freezeRecord.type === 'weekend' ? 'weekend-off' : 'manual-freeze'
    );
  }

  const cursor = new Date(options?.today ?? new Date());
  const dayStates: StreakDayState[] = [];
  const weeklyFreezeLimit = Math.max(0, options?.weeklyFreezeLimit ?? 1);
  const freezeUsageByWeek = new Map<string, number>();

  while (true) {
    const dayKey = getDateKey(cursor);
    const weekKey = getUTCWeekKey(cursor);
    const usedThisWeek = freezeUsageByWeek.get(weekKey) ?? 0;
    const storedFreezeReason = freezeReasonsByDate.get(dayKey);
    const previousDay = new Date(cursor);
    previousDay.setUTCDate(previousDay.getUTCDate() - 1);
    const previousDayKey = getDateKey(previousDay);
    const canAutoFreezeBridge =
      completedKeys.has(previousDayKey) ||
      freezeReasonsByDate.has(previousDayKey) ||
      (options?.weekendOffEnabled && isWeekendUTC(previousDay));

    if (completedKeys.has(dayKey)) {
      dayStates.push({ date: dayKey, state: 'earned' });
    } else if (storedFreezeReason === 'manual-freeze') {
      if (usedThisWeek >= weeklyFreezeLimit) {
        break;
      }

      freezeUsageByWeek.set(weekKey, usedThisWeek + 1);
      dayStates.push({ date: dayKey, state: 'freeze', reason: storedFreezeReason });
    } else if (storedFreezeReason === 'weekend-off') {
      dayStates.push({ date: dayKey, state: 'freeze', reason: storedFreezeReason });
    } else if (options?.weekendOffEnabled && isWeekendUTC(cursor)) {
      dayStates.push({ date: dayKey, state: 'freeze', reason: 'weekend-off' });
    } else if (usedThisWeek < weeklyFreezeLimit && canAutoFreezeBridge) {
      freezeUsageByWeek.set(weekKey, usedThisWeek + 1);
      dayStates.push({ date: dayKey, state: 'freeze', reason: 'manual-freeze' });
    } else {
      break;
    }

    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return {
    streakDays: dayStates.length,
    dayStates,
  };
}

export function getStreakDays(completedAtDates: string[], options?: StreakOptions) {
  return getStreakStatus(completedAtDates, options).streakDays;
}

export function getStreakMilestone(streakDays: number): (typeof STREAK_MILESTONES)[number] | null {
  return STREAK_MILESTONES.find((milestone) => milestone === streakDays) ?? null;
}

export function formatConceptLabel(conceptSlug: string | null | undefined): string | null {
  if (!conceptSlug) return null;

  const trailingSegment = conceptSlug.split('.').pop() || conceptSlug;
  const label = trailingSegment
    .replace(/[-_]/g, ' ')
    .trim();

  if (!label) return null;
  return label[0].toUpperCase() + label.slice(1);
}

export function normalizeSessionItemHref(href: string): string {
  return href.split('?')[0].split('#')[0];
}

export function resolvePrimaryConceptSlug(article: LearningArticle): string {
  if (article.primary_concept?.trim()) {
    return article.primary_concept.trim();
  }
  return `article.${article.slug}`;
}

export function getDayKeyUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function sumSessionItemMinutes(items: SessionItem[]): number {
  return items.reduce((sum, item) => sum + (item.estMinutes ?? 5), 0);
}

export function trimSessionItemsByScope(
  items: SessionItem[],
  limits: { maxItems: number; maxMinutes: number }
): SessionItem[] {
  const selected: SessionItem[] = [];
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

export function getPillarName(slug: string, library: LearningPillarWithTopics[]): string {
  const pillar = library.find((p) => p.slug === slug);
  return pillar?.name || slug.replace(/-/g, ' ');
}
