import { supabase } from '@/lib/supabase';
import { getLearningLibrary } from '@/lib/content';
import type {
  LearningArticle,
  LearningPillar,
  LearningPillarWithTopics,
} from '@/types/content';
import { isFeatureEnabled, FeatureFlags } from '@/lib/flags';
import { getUserLearningState } from '@/lib/user-learning-state';
import { deriveStateAwareIntent, deriveStaticIntent } from '@/lib/gate-intent';
import { buildIdentityOrFilter, type EffectiveIdentity } from '@/lib/auth-identity';

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
  completedIds: string[];
  allCompletionDates: string[];
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

export type SessionMode = 'pick_track' | 'normal' | 'just_finished';


export interface SessionIntent {
  type: 'bridge' | 'tradeoff' | 'foundation' | 'practice';
  from?: string[];
  to?: string[];
  text: string;
}

export interface SessionItem {
  type: 'learn' | 'practice';
  title: string;
  subtitle: string;
  pillarSlug: string;
  href: string;
  articleId?: string;
  slug?: string;
  estMinutes: number | null;
  intent: SessionIntent;
  confidence?: number;
  primaryConceptSlug?: string | null;
}

export interface LearningDelta {
  introduced: string[];
  reinforced: string[];
  unlocked: string[];
}

export interface SessionProof {
  streakDays: number;
  todayCount: number;
  last7: { date: string; count: number }[];
}

export interface SessionState {
  mode: SessionMode;
  now: SessionItem | null;
  upNext: SessionItem[];
  proof: SessionProof;
  track: { slug: string; name: string } | null;
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

function toIdentity(userId: string, googleId?: string): EffectiveIdentity {
  return googleId ? { email: userId, googleId } : { email: userId };
}

export async function getArticleCompletionStatus(userId: string, articleId: string, googleId?: string) {
  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .select('completed_at')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
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
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
    .eq('article_id', articleId)
    .maybeSingle();

  if (error || !data) {
    return { bookmarked: false };
  }

  return { bookmarked: true };
}

export async function getProgressSummary(userId: string, googleId?: string): Promise<ProgressSummary> {
  const library = await getLearningLibrary(false);
  const lookup = buildArticleLookup(library);

  const { data: progressRecords, error } = await supabase
    .from(PROGRESS_TABLE)
    .select('article_id, completed_at')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
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
    completedIds: Array.from(completedIds),
    allCompletionDates: filteredRecords.map((r) => r.completed_at),
  };
}

export async function getUserBookmarks(userId: string, googleId?: string): Promise<BookmarkItem[]> {
  const library = await getLearningLibrary(false);
  const lookup = buildArticleLookup(library);

  const { data, error } = await supabase
    .from(BOOKMARKS_TABLE)
    .select('article_id, created_at')
    .or(buildIdentityOrFilter(toIdentity(userId, googleId)))
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

export async function getSessionState(userId: string, preferredTrackSlug?: string, googleId?: string): Promise<SessionState> {
  const summary = await getProgressSummary(userId, googleId);
  const library = await getLearningLibrary(false);
  const normalizedPreferredTrack = preferredTrackSlug?.toLowerCase();
  const preferredTrack = normalizedPreferredTrack
    ? library.find((pillar) => pillar.slug === normalizedPreferredTrack)
    : null;

  const useGenerative = isFeatureEnabled(FeatureFlags.GENERATIVE_SESSIONS);
  const userState = useGenerative
    ? (await getUserLearningState(userId, preferredTrackSlug || 'dsa', googleId)).userState
    : null;

  const completedIds = new Set(summary.completedIds);
  const collectItems = (pillars: LearningPillarWithTopics[], allowCompleted: boolean) => {
    const items: SessionItem[] = [];

    for (const pillar of pillars) {
      for (const topic of pillar.topics) {
        for (const article of topic.articles) {
          if ((!completedIds.has(article.id) || allowCompleted) && items.length < 4) {
            const intent = useGenerative && userState
              ? deriveStateAwareIntent({
                primaryConceptSlug: article.primary_concept ?? null,
                userState,
                articleSlug: article.slug,
                pillarSlug: pillar.slug
              })
              : deriveStaticIntent(article.slug, pillar.slug);

            items.push({
              type: 'learn',
              title: article.title,
              subtitle: `${article.reading_time_minutes || 5} min read`,
              pillarSlug: pillar.slug,
              href: `/learn/${pillar.slug}/${article.slug}`,
              articleId: article.id,
              estMinutes: article.reading_time_minutes,
              intent,
              confidence: 0.9,
              primaryConceptSlug: article.primary_concept ?? null
            });
          }
        }
      }
    }

    return items;
  };

  let incompleteItems: SessionItem[] = [];
  if (preferredTrack) {
    incompleteItems = collectItems([preferredTrack], false);
    if (incompleteItems.length === 0) {
      incompleteItems = collectItems([preferredTrack], true);
    }
  } else {
    incompleteItems = collectItems(library, false);
  }

  const now = incompleteItems[0] || null;
  const upNext = incompleteItems.slice(1, 4);

  let mode: SessionMode = 'normal';
  if (!now) {
    mode = 'pick_track';
  } else if (summary.recentActivity.length > 0) {
    const lastCompletedAt = new Date(summary.recentActivity[0].completedAt);
    const hoursSinceCompletion = (Date.now() - lastCompletedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCompletion < 1) {
      mode = 'just_finished';
    }
  }

  const last7Map = new Map<string, number>();
  const now7 = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now7);
    d.setDate(d.getDate() - i);
    last7Map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const completedAt of summary.allCompletionDates) {
    const dateKey = completedAt.slice(0, 10);
    if (last7Map.has(dateKey)) {
      last7Map.set(dateKey, (last7Map.get(dateKey) || 0) + 1);
    }
  }
  const last7 = Array.from(last7Map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = last7Map.get(todayKey) || 0;

  const track = now
    ? { slug: now.pillarSlug, name: getPillarName(now.pillarSlug, library) }
    : preferredTrack
      ? { slug: preferredTrack.slug, name: preferredTrack.name }
      : null;

  return {
    mode,
    now,
    upNext,
    proof: {
      streakDays: summary.streakDays,
      todayCount,
      last7,
    },
    track,
  };
}

function getPillarName(slug: string, library: LearningPillarWithTopics[]): string {
  const pillar = library.find((p) => p.slug === slug);
  return pillar?.name || slug.replace(/-/g, ' ');
}


