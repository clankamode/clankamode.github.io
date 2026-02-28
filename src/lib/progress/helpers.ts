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

export function getStreakDays(completedAtDates: string[]) {
  if (!completedAtDates.length) {
    return 0;
  }

  const completedKeys = new Set(
    completedAtDates.map((completedAt) => getDateKey(new Date(completedAt)))
  );

  const todayKey = getDateKey(new Date());
  if (!completedKeys.has(todayKey)) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();

  while (completedKeys.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
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
