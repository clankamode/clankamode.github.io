import { supabase } from '@/lib/supabase';
import { getLearningLibrary } from '@/lib/content';
import type {
  LearningArticle,
  LearningPillar,
  LearningPillarWithTopics,
} from '@/types/content';

const PROGRESS_TABLE = 'UserArticleProgress';
const BOOKMARKS_TABLE = 'UserBookmarks';

interface ArticleLookupEntry {
  article: LearningArticle;
  pillar: LearningPillar;
}

export interface RecentActivityItem {
  articleId: string;
  articleSlug: string;
  pillarSlug: string;
  title: string;
  completedAt: string;
}

export interface PillarProgress {
  id: string;
  slug: string;
  name: string;
  totalArticles: number;
  completedArticles: number;
  percent: number;
}

export interface NextArticle {
  articleId: string;
  articleSlug: string;
  pillarSlug: string;
  title: string;
  readingTimeMinutes: number | null;
}

export interface ProgressSummary {
  totalArticles: number;
  completedArticles: number;
  percent: number;
  streakDays: number;
  pillars: PillarProgress[];
  recentActivity: RecentActivityItem[];
  nextArticle: NextArticle | null;
}

export interface BookmarkItem {
  articleId: string;
  articleSlug: string;
  pillarSlug: string;
  title: string;
  excerpt: string | null;
  readingTimeMinutes: number | null;
  savedAt: string;
}

function buildArticleLookup(library: LearningPillarWithTopics[]) {
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

function getStreakDays(completedAtDates: string[]) {
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

export async function getArticleCompletionStatus(userId: string, articleId: string) {
  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .select('completed_at')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .maybeSingle();

  if (error || !data) {
    return { completed: false, completedAt: null };
  }

  return { completed: true, completedAt: data.completed_at };
}

export async function getBookmarkStatus(userId: string, articleId: string) {
  const { data, error } = await supabase
    .from(BOOKMARKS_TABLE)
    .select('id')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .maybeSingle();

  if (error || !data) {
    return { bookmarked: false };
  }

  return { bookmarked: true };
}

export async function getProgressSummary(userId: string): Promise<ProgressSummary> {
  const library = await getLearningLibrary(false);
  const lookup = buildArticleLookup(library);

  const { data: progressRecords, error } = await supabase
    .from(PROGRESS_TABLE)
    .select('article_id, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    throw error;
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

  const streakDays = getStreakDays(filteredRecords.map((record) => record.completed_at));

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

  return {
    totalArticles,
    completedArticles,
    percent,
    streakDays,
    pillars,
    recentActivity,
    nextArticle,
  };
}

export async function getUserBookmarks(userId: string): Promise<BookmarkItem[]> {
  const library = await getLearningLibrary(false);
  const lookup = buildArticleLookup(library);

  const { data, error } = await supabase
    .from(BOOKMARKS_TABLE)
    .select('article_id, created_at')
    .eq('user_id', userId)
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
