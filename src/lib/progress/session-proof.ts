import { getPillarName } from '@/lib/progress/helpers';
import type { LearningPillarWithTopics } from '@/types/content';
import type { SessionItem, SessionMode } from '@/lib/progress/types';

export function deriveSessionMode(now: SessionItem | null, lastCompletedAt?: string): SessionMode {
  if (!now) {
    return 'pick_track';
  }

  if (!lastCompletedAt) {
    return 'normal';
  }

  const completedAt = new Date(lastCompletedAt);
  const hoursSinceCompletion = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCompletion < 1) {
    return 'just_finished';
  }

  return 'normal';
}

export function buildLast7Proof(completionDates: string[]): {
  last7: { date: string; count: number }[];
  todayCount: number;
} {
  const last7Map = new Map<string, number>();
  const now = new Date();

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    last7Map.set(d.toISOString().slice(0, 10), 0);
  }

  for (const completedAt of completionDates) {
    const dateKey = completedAt.slice(0, 10);
    if (last7Map.has(dateKey)) {
      last7Map.set(dateKey, (last7Map.get(dateKey) || 0) + 1);
    }
  }

  const last7 = Array.from(last7Map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayKey = new Date().toISOString().slice(0, 10);
  return {
    last7,
    todayCount: last7Map.get(todayKey) || 0,
  };
}

export function resolveSessionTrack(params: {
  now: SessionItem | null;
  preferredTrack: { slug: string; name: string } | null | undefined;
  articleCandidates: SessionItem[];
  library: LearningPillarWithTopics[];
}): { slug: string; name: string } | null {
  const { now, preferredTrack, articleCandidates, library } = params;

  if (now) {
    return { slug: now.pillarSlug, name: getPillarName(now.pillarSlug, library) };
  }

  if (preferredTrack) {
    return { slug: preferredTrack.slug, name: preferredTrack.name };
  }

  if (articleCandidates[0]) {
    return {
      slug: articleCandidates[0].pillarSlug,
      name: getPillarName(articleCandidates[0].pillarSlug, library),
    };
  }

  return null;
}
