import { supabase } from '@/lib/supabase';
import { getLearningLibrary } from '@/lib/content';
import { BOOKMARKS_TABLE, PROGRESS_TABLE, STREAK_FREEZES_TABLE } from '@/lib/progress/constants';
import { buildIdentityFilter } from '@/lib/progress/identity';
import { buildArticleLookup, getStreakStatus, type StreakDayState, type StreakFreezeRecord } from '@/lib/progress/helpers';
import type {
  BookmarkItem,
  NextArticle,
  PillarProgress,
  ProgressSummary,
  ProgressSummaryWithLibrary,
} from '@/lib/progress/types';

export async function getArticleCompletionStatus(userId: string, articleId: string, googleId?: string) {
  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .select('completed_at')
    .or(buildIdentityFilter(userId, googleId))
    .eq('article_id', articleId)
    .maybeSingle();

  if (error || !data) {
    return { completed: false, completedAt: null };
  }

  return { completed: true, completedAt: data.completed_at };
}

export async function getBookmarkStatus(userId: string, articleId: string, googleId?: string) {
  const { data, error } = await supabase
    .from(BOOKMARKS_TABLE)
    .select('id')
    .or(buildIdentityFilter(userId, googleId))
    .eq('article_id', articleId)
    .maybeSingle();

  if (error || !data) {
    return { bookmarked: false };
  }

  return { bookmarked: true };
}

export interface ProgressSummaryOptions {
  streak?: {
    freezeDates?: string[];
    weeklyFreezeLimit?: number;
    weekendOffEnabled?: boolean;
  };
}

function getFreezeType(reason: StreakDayState['reason']): StreakFreezeRecord['type'] {
  return reason === 'weekend-off' ? 'weekend' : 'manual';
}

function getDayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export async function getProgressSummaryWithLibrary(
  userId: string,
  googleId?: string,
  options?: ProgressSummaryOptions
): Promise<ProgressSummaryWithLibrary> {
  const library = await getLearningLibrary(false);
  const lookup = buildArticleLookup(library);

  const [{ data: progressRecords, error }, { data: userRecord, error: userError }] = await Promise.all([
    supabase
      .from(PROGRESS_TABLE)
      .select('article_id, completed_at')
      .or(buildIdentityFilter(userId, googleId))
      .order('completed_at', { ascending: false }),
    supabase
      .from('Users')
      .select('id, weekend_off_enabled')
      .eq('email', userId)
      .maybeSingle(),
  ]);

  if (error) {
    throw error;
  }
  if (userError) {
    throw userError;
  }

  const { data: freezeRows, error: freezeError } = userRecord?.id
    ? await supabase
        .from(STREAK_FREEZES_TABLE)
        .select('used_at, type')
        .eq('user_id', userRecord.id)
        .order('used_at', { ascending: false })
    : { data: [], error: null };

  if (freezeError) {
    throw freezeError;
  }

  const filteredRecords = (progressRecords || []).filter((record) => lookup.has(record.article_id));
  const completedIds = new Set(filteredRecords.map((record) => record.article_id));

  const pillars: PillarProgress[] = library.map((pillar) => {
    const totalArticles = pillar.topics.reduce((sum, topic) => sum + topic.articles.length, 0);
    const completedArticles = pillar.topics.reduce((sum, topic) => {
      return (
        sum +
        topic.articles.reduce((articleSum, article) => {
          return articleSum + (completedIds.has(article.id) ? 1 : 0);
        }, 0)
      );
    }, 0);
    const percent = totalArticles ? Math.round((completedArticles / totalArticles) * 100) : 0;

    return {
      id: pillar.id,
      slug: pillar.slug,
      name: pillar.name,
      totalArticles,
      completedArticles,
      percent,
    };
  });

  const totalArticles = pillars.reduce((sum, pillar) => sum + pillar.totalArticles, 0);
  const completedArticles = pillars.reduce((sum, pillar) => sum + pillar.completedArticles, 0);
  const percent = totalArticles ? Math.round((completedArticles / totalArticles) * 100) : 0;

  const recentActivity = filteredRecords.slice(0, 5).map((record) => {
    const entry = lookup.get(record.article_id);
    return {
      articleId: record.article_id,
      articleSlug: entry?.article.slug ?? '',
      pillarSlug: entry?.pillar.slug ?? '',
      title: entry?.article.title ?? 'Unknown article',
      completedAt: record.completed_at,
    };
  });

  const storedFreezeRecords: StreakFreezeRecord[] = (freezeRows || []).map((row) => ({
    usedAt: row.used_at,
    type: row.type,
  }));
  const streakStatus = getStreakStatus(filteredRecords.map((record) => record.completed_at), {
    freezeDates: options?.streak?.freezeDates,
    freezeRecords: storedFreezeRecords,
    weeklyFreezeLimit: options?.streak?.weeklyFreezeLimit ?? 1,
    weekendOffEnabled: options?.streak?.weekendOffEnabled ?? Boolean(userRecord?.weekend_off_enabled),
  });
  const streakDays = streakStatus.streakDays;

  if (userRecord?.id) {
    const existingFreezeKeys = new Set(
      storedFreezeRecords.map((record) => `${getDayKey(record.usedAt)}:${record.type}`)
    );
    const missingFreezeRows = streakStatus.dayStates
      .filter((dayState) => dayState.state === 'freeze' && dayState.reason)
      .filter((dayState) => !existingFreezeKeys.has(`${dayState.date}:${getFreezeType(dayState.reason)}`))
      .map((dayState) => ({
        user_id: userRecord.id,
        used_at: `${dayState.date}T12:00:00.000Z`,
        type: getFreezeType(dayState.reason),
      }));

    if (missingFreezeRows.length > 0) {
      const { error: insertError } = await supabase.from(STREAK_FREEZES_TABLE).insert(missingFreezeRows);
      if (insertError) {
        throw insertError;
      }
    }
  }

  let nextArticle: NextArticle | null = null;
  for (const pillar of library) {
    for (const topic of pillar.topics) {
      for (const article of topic.articles) {
        if (!completedIds.has(article.id)) {
          nextArticle = {
            articleId: article.id,
            articleSlug: article.slug,
            pillarSlug: pillar.slug,
            title: article.title,
            readingTimeMinutes: article.reading_time_minutes,
          };
          break;
        }
      }
      if (nextArticle) break;
    }
    if (nextArticle) break;
  }

  const summary: ProgressSummary = {
    totalArticles,
    completedArticles,
    percent,
    streakDays,
    streakDayStates: streakStatus.dayStates,
    pillars,
    recentActivity,
    nextArticle,
    completedIds: Array.from(completedIds) as string[],
    allCompletionDates: filteredRecords.map((r) => r.completed_at),
  };

  return {
    summary,
    library,
  };
}

export async function getProgressSummary(
  userId: string,
  googleId?: string,
  options?: ProgressSummaryOptions
): Promise<ProgressSummary> {
  const { summary } = await getProgressSummaryWithLibrary(userId, googleId, options);
  return summary;
}

export async function getUserBookmarks(userId: string, googleId?: string): Promise<BookmarkItem[]> {
  const library = await getLearningLibrary(false);
  const lookup = buildArticleLookup(library);

  const { data, error } = await supabase
    .from(BOOKMARKS_TABLE)
    .select('article_id, created_at')
    .or(buildIdentityFilter(userId, googleId))
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .map((record) => {
      const entry = lookup.get(record.article_id);
      if (!entry) {
        return null;
      }
      return {
        articleId: record.article_id,
        articleSlug: entry.article.slug,
        pillarSlug: entry.pillar.slug,
        title: entry.article.title,
        excerpt: entry.article.excerpt,
        readingTimeMinutes: entry.article.reading_time_minutes,
        savedAt: record.created_at,
      };
    })
    .filter((item): item is BookmarkItem => item !== null);
}
