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
  weeklyFreezeLimit?: number;
  weekendOffEnabled?: boolean;
  today?: Date;
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

export function getStreakStatus(completedAtDates: string[], options?: StreakOptions): StreakStatus {
  if (!completedAtDates.length) {
    return { streakDays: 0, dayStates: [] };
  }

  const completedKeys = new Set(
    completedAtDates.map((completedAt) => getDateKey(new Date(completedAt)))
  );
  const freezeKeys = new Set(
    (options?.freezeDates || []).map((freezeDate) => getDateKey(new Date(freezeDate)))
  );

  const cursor = new Date(options?.today ?? new Date());
  const dayStates: StreakDayState[] = [];
  const weeklyFreezeLimit = Math.max(0, options?.weeklyFreezeLimit ?? Number.POSITIVE_INFINITY);
  const freezeUsageByWeek = new Map<string, number>();

  while (true) {
    const dayKey = getDateKey(cursor);

    if (completedKeys.has(dayKey)) {
      dayStates.push({ date: dayKey, state: 'earned' });
    } else if (freezeKeys.has(dayKey)) {
      const weekKey = getUTCWeekKey(cursor);
      const usedThisWeek = freezeUsageByWeek.get(weekKey) ?? 0;

      if (usedThisWeek >= weeklyFreezeLimit) {
        break;
      }

      freezeUsageByWeek.set(weekKey, usedThisWeek + 1);
      dayStates.push({ date: dayKey, state: 'freeze', reason: 'manual-freeze' });
    } else if (options?.weekendOffEnabled && isWeekendUTC(cursor)) {
      dayStates.push({ date: dayKey, state: 'freeze', reason: 'weekend-off' });
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
